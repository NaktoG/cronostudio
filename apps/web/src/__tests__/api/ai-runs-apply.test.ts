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
    withSecurityHeaders: vi.fn((response: Response) => response),
    withAuth: (handler: MockRouteHandler) => async (request: NextRequest, ...args: unknown[]) => {
      const user = await getAuthUser(request);
      if (!user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      return handler(request, ...args);
    },
  };
});

vi.mock('@/middleware/rateLimit', () => ({
  API_RATE_LIMIT: { windowMs: 900000, max: 100 },
  rateLimit: () => (handler: MockRouteHandler) => handler,
}));

vi.mock('@/middleware/rbac', () => ({
  requireRoles: () => (handler: MockRouteHandler) => handler,
}));

vi.mock('@/lib/ai/profiles', () => ({
  getAiProfile: vi.fn(() => ({
    key: 'evergreen_ideas',
    version: 1,
    apply: vi.fn(async () => ({ applied: { ideaIds: ['idea-1'] } })),
  })),
}));

import { query } from '@/lib/db';
import { getAuthUser, type JWTPayload } from '@/middleware/auth';

describe('AI Runs apply API', () => {
  const ownerUser = { userId: 'user-1', email: 'demo@example.com', role: 'owner' } as JWTPayload;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies completed run output', async () => {
    vi.mocked(getAuthUser).mockReturnValue(ownerUser);
    vi.mocked(query)
      .mockResolvedValueOnce({
        rows: [{
          id: 'run-1',
          channel_id: 'channel-1',
          profile_key: 'evergreen_ideas',
          profile_version: 1,
          status: 'completed',
          input_json: { channelId: 'channel-1' },
          output_json: { ideas: [] },
        }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const { POST } = await import('@/app/api/ai/runs/[id]/apply/route');
    const request = new NextRequest('http://localhost:3000/api/ai/runs/run-1/apply', { method: 'POST' });

    const response = await POST(request, { params: Promise.resolve({ id: 'run-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.applied.ideaIds).toEqual(['idea-1']);
  });
});
