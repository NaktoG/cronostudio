import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/middleware/auth', () => ({
  withSecurityHeaders: (response: Response) => response,
  getAuthUser: () => ({ userId: 'user-1' }),
}));

vi.mock('@/middleware/rateLimit', () => ({
  rateLimit: () => (handler: (request: NextRequest) => Promise<Response>) => handler,
  API_RATE_LIMIT: {},
}));

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

const { GET } = await import('@/app/api/discipline/weekly/route');
const { query } = await import('@/lib/db');

const madridNow = new Date('2026-02-25T10:00:00+01:00');

function buildRequest(channelId = 'channel-1') {
  return new NextRequest(`http://localhost/api/discipline/weekly?channelId=${channelId}`);
}

function mockQueries(publishRows: Array<{ published_at: string }>) {
  (query as unknown as ReturnType<typeof vi.fn>).mockImplementation((text: string) => {
    if (text.includes('FROM channels')) {
      return { rows: [{ id: 'channel-1', name: 'Canal QA' }] };
    }
    if (text.includes('FROM publish_events') && text.includes('BETWEEN')) {
      return { rows: publishRows };
    }
    if (text.includes('FROM publish_events') && text.includes('>= $3')) {
      return { rows: publishRows };
    }
    return { rows: [] };
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(madridNow);
});

afterEach(() => {
  vi.useRealTimers();
  (query as unknown as ReturnType<typeof vi.fn>).mockReset();
});

describe('GET /api/discipline/weekly', () => {
  it('returns 0/2 when no publish events exist', async () => {
    mockQueries([]);
    const response = await GET(buildRequest());
    const payload = await response.json();

    expect(payload.scoreboard.count).toBe(0);
    expect(payload.scoreboard.target).toBe(2);
    expect(payload.status).toBe('EN_RIESGO');
    expect(payload.slots).toHaveLength(2);
  });

  it('returns 1/2 when only Tuesday is published', async () => {
    mockQueries([{ published_at: '2026-02-24T12:00:00.000Z' }]);
    const response = await GET(buildRequest());
    const payload = await response.json();

    expect(payload.scoreboard.count).toBe(1);
    expect(payload.slots[0].done).toBe(true);
    expect(payload.slots[1].done).toBe(false);
    expect(payload.status).toBe('OK');
  });

  it('returns 2/2 and CUMPLIDA when Tuesday and Friday are published', async () => {
    mockQueries([
      { published_at: '2026-02-24T12:00:00.000Z' },
      { published_at: '2026-02-27T12:00:00.000Z' },
    ]);
    const response = await GET(buildRequest());
    const payload = await response.json();

    expect(payload.scoreboard.count).toBe(2);
    expect(payload.status).toBe('CUMPLIDA');
    expect(payload.slots.every((slot: { done: boolean }) => slot.done)).toBe(true);
  });
});
