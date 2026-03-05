import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

type MockRouteHandler = (request: NextRequest, ...args: unknown[]) => Promise<Response> | Response;

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('@/middleware/auth', () => {
  const getAuthUser = vi.fn();
  return {
    getAuthUser,
    withSecurityHeaders: vi.fn((response: Response) => {
      response.headers.set('X-Content-Type-Options', 'nosniff');
      return response;
    }),
    withAuth: (handler: MockRouteHandler) => async (request: NextRequest, ...args: unknown[]) => {
      const user = await getAuthUser(request);
      if (!user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      return handler(request, ...args);
    },
  };
});

import { getAuthUser, type JWTPayload } from '@/middleware/auth';

describe('Weekly Goals API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const ownerUser = { userId: 'user-1', email: 'demo@example.com', role: 'owner' } as JWTPayload;

  it('returns 400 when isoWeek is invalid', async () => {
    vi.mocked(getAuthUser).mockReturnValue(ownerUser);
    const { GET } = await import('@/app/api/weekly-goals/route');

    const request = new NextRequest('http://localhost:3000/api/weekly-goals?isoWeek=99');
    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});
