import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, TEST_EMAILS, TEST_IDS } from '@/__tests__/utils/testConstants';
import { USER_ROLE_OWNER } from '@/domain/value-objects/UserRole';

type MockRouteHandler = (request: NextRequest, ...args: unknown[]) => Promise<Response> | Response;

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));
vi.mock('@/middleware/auth', () => {
  const getAuthUser = vi.fn();
  return {
    getAuthUser,
    withSecurityHeaders: vi.fn((response: Response) => response),
  };
});
vi.mock('@/middleware/rateLimit', () => ({
  API_RATE_LIMIT: {},
  rateLimit: () => (handler: MockRouteHandler) => handler,
}));

import { query } from '@/lib/db';
import { getAuthUser, type JWTPayload } from '@/middleware/auth';

describe('Calendar API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const ownerUser = { userId: TEST_IDS.userId, email: TEST_EMAILS.owner, role: USER_ROLE_OWNER } as JWTPayload;

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(getAuthUser).mockReturnValue(null);
    const { GET } = await import('@/app/api/calendar/route');
    const request = createRequest('/api/calendar?from=2026-02-01&to=2026-02-28');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('returns calendar items with expected shape', async () => {
    vi.mocked(getAuthUser).mockReturnValue(ownerUser);
    vi.mocked(query).mockResolvedValue({
      rows: [
        {
          id: TEST_IDS.productionId,
          title: 'Calendario Demo',
          status: 'publishing',
          scheduled_at: '2026-02-10T10:00:00.000Z',
        },
      ],
    });

    const { GET } = await import('@/app/api/calendar/route');
    const request = createRequest('/api/calendar?from=2026-02-01&to=2026-02-28');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({
      id: TEST_IDS.productionId,
      title: 'Calendario Demo',
      type: 'production',
      status: 'publishing',
      route: `/productions/${TEST_IDS.productionId}`,
    });
  });
});
