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

const { GET } = await import('@/app/api/integrations/youtube/diagnostics/route');
const { query } = await import('@/lib/db');

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  (query as unknown as ReturnType<typeof vi.fn>).mockReset();
});

describe('GET /api/integrations/youtube/diagnostics', () => {
  it('reports missing envs and db table status', async () => {
    delete process.env.YOUTUBE_OAUTH_CLIENT_ID;
    delete process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
    delete process.env.YOUTUBE_OAUTH_REDIRECT_URI;
    delete process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY;

    (query as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [{ exists: false }] });

    const response = await GET(new NextRequest('http://localhost/api/integrations/youtube/diagnostics'));
    const payload = await response.json();

    expect(payload.envConfigured.clientId).toBe(false);
    expect(payload.envConfigured.clientSecret).toBe(false);
    expect(payload.envConfigured.redirectUri).toBe(false);
    expect(payload.envConfigured.encryptionKey).toBe(false);
    expect(payload.dbReady).toBe(true);
    expect(payload.tableExists).toBe(false);
  });

  it('returns sample row with encrypted lengths', async () => {
    process.env.YOUTUBE_OAUTH_CLIENT_ID = 'client';
    process.env.YOUTUBE_OAUTH_CLIENT_SECRET = 'secret';
    process.env.YOUTUBE_OAUTH_REDIRECT_URI = 'http://localhost:3000/api/integrations/youtube/callback';
    process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY = 'base64key';

    (query as unknown as ReturnType<typeof vi.fn>).mockImplementation((text: string) => {
      if (text.includes('information_schema.tables')) {
        return { rows: [{ exists: true }] };
      }
      if (text.includes('COUNT(*)')) {
        return { rows: [{ count: 1 }] };
      }
      return {
        rows: [
          {
            youtube_channel_id: 'UC1234567890123456789012',
            youtube_channel_title: 'QA Channel',
            scope: 'https://www.googleapis.com/auth/youtube.readonly',
            token_expiry_at: '2026-03-01T12:00:00.000Z',
            access_token_enc: 'enc_access_token_blob',
            refresh_token_enc: 'enc_refresh_token_blob',
          },
        ],
      };
    });

    const response = await GET(new NextRequest('http://localhost/api/integrations/youtube/diagnostics'));
    const payload = await response.json();

    expect(payload.integrationRows.rowCount).toBe(1);
    expect(payload.integrationRows.sampleRow.access_token_enc_len).toBeGreaterThan(0);
    expect(payload.integrationRows.sampleRow.refresh_token_enc_len).toBeGreaterThan(0);
  });
});
