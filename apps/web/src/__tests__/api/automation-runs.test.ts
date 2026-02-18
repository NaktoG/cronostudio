import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, TEST_EMAILS, TEST_IDS, TEST_SECRET } from '@/__tests__/utils/testConstants';
import type { NextRequest } from 'next/server';
import { USER_ROLE_COLLABORATOR, USER_ROLE_OWNER } from '@/domain/value-objects/UserRole';
import type { JWTPayload } from '@/middleware/auth';

type MockRouteHandler = (request: NextRequest, ...args: unknown[]) => Promise<Response> | Response;

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));
vi.mock('@/lib/config', () => ({
  config: {
    webhooks: {
      secret: TEST_SECRET,
    },
    serviceUser: {
      id: TEST_IDS.userId,
    },
  },
}));
vi.mock('@/lib/serviceUser', () => ({
  resolveServiceUserId: vi.fn(),
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
import { getAuthUser } from '@/middleware/auth';
import { resolveServiceUserId } from '@/lib/serviceUser';

describe('Automation Runs API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const ownerUser = { userId: TEST_IDS.userId, email: TEST_EMAILS.owner, role: USER_ROLE_OWNER } as JWTPayload;
  const collaboratorUser = { userId: TEST_IDS.userId, email: TEST_EMAILS.user, role: USER_ROLE_COLLABORATOR } as JWTPayload;

  describe('POST /api/automation-runs', () => {
    it('returns 201 when service secret is valid', async () => {
      vi.mocked(getAuthUser).mockReturnValue(null);
      vi.mocked(resolveServiceUserId).mockResolvedValue(TEST_IDS.userId);
      vi.mocked(query)
        .mockResolvedValueOnce({ rows: [{ id: TEST_IDS.automationRunId, status: 'running' }], rowCount: 1 });
      const { POST } = await import('@/app/api/automation-runs/route');

      const request = createRequest('/api/automation-runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cronostudio-webhook-secret': TEST_SECRET,
        },
        body: JSON.stringify({ workflowName: 'sync-videos', status: 'running' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(vi.mocked(query)).toHaveBeenCalledTimes(1);
    });

    it('returns 401 when no auth and no secret provided', async () => {
      vi.mocked(getAuthUser).mockReturnValue(null);
      const { POST } = await import('@/app/api/automation-runs/route');

      const request = createRequest('/api/automation-runs', {
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
      vi.mocked(resolveServiceUserId).mockResolvedValue(TEST_IDS.userId);
      vi.mocked(query).mockResolvedValueOnce({ rows: [{ id: TEST_IDS.automationRunId, status: 'running' }], rowCount: 1 });
      const { POST } = await import('@/app/api/automation-runs/route');

      const request = createRequest('/api/automation-runs', {
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

    it('returns 401 when secret is invalid', async () => {
      vi.mocked(getAuthUser).mockReturnValue(null);
      const { POST } = await import('@/app/api/automation-runs/route');

      const request = createRequest('/api/automation-runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cronostudio-webhook-secret': 'invalid-secret',
        },
        body: JSON.stringify({ workflowName: 'sync-videos', status: 'running' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('returns 403 when user is not owner and no secret provided', async () => {
      vi.mocked(getAuthUser).mockReturnValue(collaboratorUser);
      const { POST } = await import('@/app/api/automation-runs/route');

      const request = createRequest('/api/automation-runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflowName: 'sync-videos', status: 'running' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it('returns 500 when service user is misconfigured', async () => {
      vi.mocked(getAuthUser).mockReturnValue(null);
      vi.mocked(resolveServiceUserId).mockResolvedValue(null);
      const { POST } = await import('@/app/api/automation-runs/route');

      const request = createRequest('/api/automation-runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cronostudio-webhook-secret': TEST_SECRET,
        },
        body: JSON.stringify({ workflowName: 'sync-videos', status: 'running' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});
