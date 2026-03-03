import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
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
  getClient: vi.fn(),
}));

const { POST } = await import('@/app/api/discipline/publish/route');
const { getClient } = await import('@/lib/db');

const madridNow = new Date('2026-02-25T10:00:00+01:00');
const CHANNEL_ID = '11111111-1111-1111-1111-111111111111';

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/discipline/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(madridNow);
});

afterEach(() => {
  vi.useRealTimers();
  (getClient as unknown as ReturnType<typeof vi.fn>).mockReset();
});

describe('POST /api/discipline/publish', () => {
  it('creates publish event for Tuesday slot', async () => {
    const client = {
      query: vi.fn(async (text: string) => {
        if (text.includes('SELECT id FROM channels')) {
          return { rows: [{ id: 'channel-1' }] };
        }
        if (text.includes('FROM publish_events') && text.includes('BETWEEN')) {
          return { rows: [] };
        }
        if (text.includes('INSERT INTO productions')) {
          return { rows: [{ id: 'prod-1' }] };
        }
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    (getClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

    const response = await POST(buildRequest({ channelId: CHANNEL_ID, targetDay: 'tuesday' }));
    const payload = await response.json();

    expect(payload.alreadyRegistered).toBe(false);
    expect(payload.targetDay).toBe('tuesday');
  });

  it('is idempotent for duplicate Tuesday clicks', async () => {
    const client = {
      query: vi.fn(async (text: string) => {
        if (text.includes('SELECT id FROM channels')) {
          return { rows: [{ id: 'channel-1' }] };
        }
        if (text.includes('FROM publish_events') && text.includes('BETWEEN')) {
          return { rows: [{ id: 'event-1', published_at: '2026-02-24T12:00:00.000Z' }] };
        }
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    (getClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

    const response = await POST(buildRequest({ channelId: CHANNEL_ID, targetDay: 'tuesday' }));
    const payload = await response.json();

    expect(payload.alreadyRegistered).toBe(true);
    expect(payload.eventId).toBe('event-1');
    expect(client.query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO productions'), expect.anything());
  });
});
