import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { makeApiRequest } from '@/__tests__/utils/requests';
import { makeTestId } from '@/__tests__/utils/testIds';
import { makeQueryResult } from '@/__tests__/utils/db';

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
      const user = getAuthUser(request);
      if (!user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      (request as AuthenticatedRequest).user = user;
      return handler(request, ...args);
    },
  };
});
vi.mock('@/lib/validation', () => ({
  validateInput: vi.fn(),
  UpdateVideoSchema: {},
}));

import { query } from '@/lib/db';
import { getAuthUser, type JWTPayload, type AuthenticatedRequest } from '@/middleware/auth';
import { validateInput } from '@/lib/validation';

describe('Videos API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const ownerUser = {
    userId: makeTestId('user'),
    email: `${makeTestId('email')}@example.test`,
    role: 'owner',
  } as JWTPayload;

  describe('GET /api/videos/[id]', () => {
    it('returns 401 when request lacks auth', async () => {
      vi.mocked(getAuthUser).mockReturnValue(null);
      const { GET } = await import('@/app/api/videos/[id]/route');

      const videoId = makeTestId('video');
      const request = makeApiRequest(`/api/videos/${videoId}`);
      const response = await GET(request, { params: Promise.resolve({ id: videoId }) });
      expect(response.status).toBe(401);
    });

    it('returns 404 when video belongs to another user', async () => {
      vi.mocked(getAuthUser).mockReturnValue(ownerUser);
      vi.mocked(query).mockResolvedValue(makeQueryResult([]));
      const { GET } = await import('@/app/api/videos/[id]/route');
      const videoId = makeTestId('video');
      const request = makeApiRequest(`/api/videos/${videoId}`);
      const response = await GET(request, { params: Promise.resolve({ id: videoId }) });
      expect(response.status).toBe(404);
    });

    it('returns video when owner matches', async () => {
      vi.mocked(getAuthUser).mockReturnValue(ownerUser);
      const videoId = makeTestId('video');
      vi.mocked(query).mockResolvedValue(makeQueryResult([{ id: videoId, title: 'Demo' }]));
      const { GET } = await import('@/app/api/videos/[id]/route');
      const request = makeApiRequest(`/api/videos/${videoId}`);
      const response = await GET(request, { params: Promise.resolve({ id: videoId }) });
      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/videos/[id]', () => {
    it('returns 401 when user is not authenticated', async () => {
      vi.mocked(getAuthUser).mockReturnValue(null);
      const { PUT } = await import('@/app/api/videos/[id]/route');

      const videoId = makeTestId('video');
      const request = makeApiRequest(`/api/videos/${videoId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'New title' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: videoId }) });
      expect(response.status).toBe(401);
    });

    it('returns 404 when video is missing for user', async () => {
      vi.mocked(getAuthUser).mockReturnValue(ownerUser);
      vi.mocked(validateInput).mockReturnValue({ title: 'Updated title' } as { title?: string });
      vi.mocked(query).mockResolvedValueOnce(makeQueryResult([]));
      const { PUT } = await import('@/app/api/videos/[id]/route');

      const videoId = makeTestId('video');
      const request = makeApiRequest(`/api/videos/${videoId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated title' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: videoId }) });
      expect(response.status).toBe(404);
    });

    it('updates video when payload is valid', async () => {
      vi.mocked(getAuthUser).mockReturnValue(ownerUser);
      vi.mocked(validateInput).mockReturnValue({ title: 'Updated title', views: 42 } as { title?: string; views?: number });
      const videoId = makeTestId('video');
      vi.mocked(query)
        .mockResolvedValueOnce(makeQueryResult([{ id: videoId }]))
        .mockResolvedValueOnce(makeQueryResult([{ id: videoId, title: 'Updated title' }]));
      const { PUT } = await import('@/app/api/videos/[id]/route');

      const request = makeApiRequest(`/api/videos/${videoId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated title', views: 42 }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: videoId }) });
      expect(response.status).toBe(200);
      expect(vi.mocked(query)).toHaveBeenCalledTimes(2);
    });
  });

  describe('DELETE /api/videos/[id]', () => {
    it('returns 401 when user is not authenticated', async () => {
      vi.mocked(getAuthUser).mockReturnValue(null);
      const { DELETE } = await import('@/app/api/videos/[id]/route');
      const videoId = makeTestId('video');
      const request = makeApiRequest(`/api/videos/${videoId}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: videoId }) });
      expect(response.status).toBe(401);
    });

    it('returns 404 when video is missing', async () => {
      vi.mocked(getAuthUser).mockReturnValue(ownerUser);
      vi.mocked(query).mockResolvedValueOnce(makeQueryResult([]));
      const { DELETE } = await import('@/app/api/videos/[id]/route');
      const videoId = makeTestId('video');
      const request = makeApiRequest(`/api/videos/${videoId}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: videoId }) });
      expect(response.status).toBe(404);
    });

    it('returns 204 when video is deleted', async () => {
      vi.mocked(getAuthUser).mockReturnValue(ownerUser);
      const videoId = makeTestId('video');
      vi.mocked(query).mockResolvedValueOnce(makeQueryResult([{ id: videoId, title: 'Demo' }]));
      const { DELETE } = await import('@/app/api/videos/[id]/route');
      const request = makeApiRequest(`/api/videos/${videoId}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: videoId }) });
      expect(response.status).toBe(204);
    });
  });
});
