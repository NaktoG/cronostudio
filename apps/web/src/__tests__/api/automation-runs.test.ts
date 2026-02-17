import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

type MockRouteHandler = (request: NextRequest, ...args: unknown[]) => Promise<Response> | Response;

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));
vi.mock('@/lib/config', () => ({
  config: {
    webhooks: {
      secret: 'test-secret',
    },
  },
}));
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));
vi.mock('@/lib/observability', () => ({
  emitMetric: vi.fn(),
}));
vi.mock('@/middleware/auth', () => {
  const getAuthUser = vi.fn();
  return {
    getAuthUser,
    withSecurityHeaders: vi.fn((response: Response) => response),
    withAuth: (handler: MockRouteHandler) => async (request: NextRequest, ...args: unknown[]) => {
      const user = getAuthUser(request);
      if (!user) {
        return Response.json({ error: 'No autorizado' }, { status: 401 });
      }
      return handler(request, ...args);
    },
  };
});

import { query } from '@/lib/db';
import { getAuthUser, type JWTPayload } from '@/middleware/auth';

describe('Automation Runs API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const ownerUser = { userId: 'user-1', email: 'demo@example.com', role: 'owner' } as JWTPayload;

  describe('POST /api/automation-runs', () => {
    it('returns 201 when service secret is valid', async () => {
      vi.mocked(getAuthUser).mockReturnValue(null);
      vi.mocked(query)
        .mockResolvedValueOnce({ rows: [{ id: 'automation-user' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ id: 'run-1', status: 'running' }], rowCount: 1 });
      const { POST } = await import('@/app/api/automation-runs/route');

      const request = new NextRequest('http://localhost:3000/api/automation-runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cronostudio-webhook-secret': 'test-secret',
        },
        body: JSON.stringify({ workflowName: 'sync-videos', status: 'running' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(vi.mocked(query)).toHaveBeenCalledTimes(2);
    });

    it('returns 401 when no auth and no secret provided', async () => {
      vi.mocked(getAuthUser).mockReturnValue(null);
      const { POST } = await import('@/app/api/automation-runs/route');

      const request = new NextRequest('http://localhost:3000/api/automation-runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflowName: 'sync-videos', status: 'running' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('returns 201 when cookie auth is valid without secret', async () => {
      vi.mocked(getAuthUser).mockReturnValue(ownerUser);
      vi.mocked(query).mockResolvedValueOnce({ rows: [{ id: 'run-1', status: 'running' }], rowCount: 1 });
      const { POST } = await import('@/app/api/automation-runs/route');

      const request = new NextRequest('http://localhost:3000/api/automation-runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflowName: 'sync-videos', status: 'running' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(vi.mocked(query)).toHaveBeenCalledTimes(1);
    });
  });
});
