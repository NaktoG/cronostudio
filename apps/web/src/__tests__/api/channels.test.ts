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
      const user = getAuthUser(request);
      if (!user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      return handler(request, ...args);
    },
  };
});

import { getAuthUser } from '@/middleware/auth';

describe('Channels API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 with security headers when unauthenticated', async () => {
    vi.mocked(getAuthUser).mockReturnValue(null);
    const { GET } = await import('@/app/api/channels/route');

    const request = new NextRequest('http://localhost:3000/api/channels');
    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});
