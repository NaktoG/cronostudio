import { describe, expect, it, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/middleware/auth', () => ({
  withSecurityHeaders: (response: Response) => response,
  getAuthUser: () => ({ userId: 'user-1' }),
  withAuth: <Context>(handler: (request: NextRequest, context: Context) => Promise<Response>) =>
    (request: NextRequest, context: Context) => {
      (request as unknown as { user: { id: string; role: string } }).user = { id: 'user-1', role: 'owner' };
      return handler(request, context);
    },
}));

vi.mock('@/middleware/rateLimit', () => ({
  rateLimit: () => (handler: (request: NextRequest) => Promise<Response>) => handler,
  API_RATE_LIMIT: {},
}));

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('@/lib/crypto/secretBox', () => ({
  openSecret: () => 'access-token',
}));

vi.mock('@/lib/youtube/client', () => ({
  fetchUploadsPlaylist: vi.fn(),
  fetchPlaylistItems: vi.fn(),
  refreshAccessToken: vi.fn(),
}));

const { GET } = await import('@/app/api/integrations/youtube/reconcile/weekly/route');
const { query } = await import('@/lib/db');
const { fetchUploadsPlaylist, fetchPlaylistItems } = await import('@/lib/youtube/client');

afterEach(() => {
  (query as unknown as ReturnType<typeof vi.fn>).mockReset();
  (fetchUploadsPlaylist as unknown as ReturnType<typeof vi.fn>).mockReset();
  (fetchPlaylistItems as unknown as ReturnType<typeof vi.fn>).mockReset();
});

function buildRequest() {
  return new NextRequest('http://localhost/api/integrations/youtube/reconcile/weekly?isoYear=2026&isoWeek=9&channelId=channel-1');
}

describe('GET /api/integrations/youtube/reconcile/weekly', () => {
  it('suggests actions when YouTube has 2/2 and publish_events 0/2', async () => {
    (query as unknown as ReturnType<typeof vi.fn>).mockImplementation((text: string) => {
      if (text.includes('FROM youtube_integrations')) {
        return { rows: [{ id: 'yt-1', youtube_channel_id: 'UC123', access_token_enc: 'enc', refresh_token_enc: null, token_expiry_at: null }] };
      }
      if (text.includes('FROM publish_events')) {
        return { rows: [] };
      }
      return { rows: [] };
    });
    (fetchUploadsPlaylist as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      channelId: 'UC123',
      uploadsPlaylistId: 'PL1',
    });
    (fetchPlaylistItems as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { videoId: 'vid1', title: 'Video 1', publishedAt: '2026-02-24T12:00:00.000Z' },
      { videoId: 'vid2', title: 'Video 2', publishedAt: '2026-02-27T12:00:00.000Z' },
    ]);

    const response = await GET(buildRequest());
    const payload = await response.json();

    expect(payload.reconciliation.tue).toBe('missing_publish_event');
    expect(payload.reconciliation.fri).toBe('missing_publish_event');
    expect(payload.suggestedActions).toHaveLength(2);
  });

  it('returns ok when YouTube and publish_events are aligned', async () => {
    (query as unknown as ReturnType<typeof vi.fn>).mockImplementation((text: string) => {
      if (text.includes('FROM youtube_integrations')) {
        return { rows: [{ id: 'yt-1', youtube_channel_id: 'UC123', access_token_enc: 'enc', refresh_token_enc: null, token_expiry_at: null }] };
      }
      if (text.includes('FROM publish_events')) {
        return { rows: [
          { id: 'evt-1', published_at: '2026-02-24T10:00:00.000Z' },
          { id: 'evt-2', published_at: '2026-02-27T10:00:00.000Z' },
        ] };
      }
      return { rows: [] };
    });
    (fetchUploadsPlaylist as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      channelId: 'UC123',
      uploadsPlaylistId: 'PL1',
    });
    (fetchPlaylistItems as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { videoId: 'vid1', title: 'Video 1', publishedAt: '2026-02-24T12:00:00.000Z' },
      { videoId: 'vid2', title: 'Video 2', publishedAt: '2026-02-27T12:00:00.000Z' },
    ]);

    const response = await GET(buildRequest());
    const payload = await response.json();

    expect(payload.reconciliation.tue).toBe('ok');
    expect(payload.reconciliation.fri).toBe('ok');
    expect(payload.suggestedActions).toHaveLength(0);
  });

  it('handles mixed reconciliation results', async () => {
    (query as unknown as ReturnType<typeof vi.fn>).mockImplementation((text: string) => {
      if (text.includes('FROM youtube_integrations')) {
        return { rows: [{ id: 'yt-1', youtube_channel_id: 'UC123', access_token_enc: 'enc', refresh_token_enc: null, token_expiry_at: null }] };
      }
      if (text.includes('FROM publish_events')) {
        return { rows: [
          { id: 'evt-1', published_at: '2026-02-24T10:00:00.000Z' },
        ] };
      }
      return { rows: [] };
    });
    (fetchUploadsPlaylist as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      channelId: 'UC123',
      uploadsPlaylistId: 'PL1',
    });
    (fetchPlaylistItems as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { videoId: 'vid1', title: 'Video 1', publishedAt: '2026-02-24T12:00:00.000Z' },
    ]);

    const response = await GET(buildRequest());
    const payload = await response.json();

    expect(payload.reconciliation.tue).toBe('ok');
    expect(payload.reconciliation.fri).toBe('missing_youtube_video');
  });
});
