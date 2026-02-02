import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));
vi.mock('@/middleware/auth', () => ({
  getAuthUser: vi.fn(),
  withSecurityHeaders: vi.fn((response: Response) => response),
}));
vi.mock('@/lib/validation', () => ({
  validateInput: vi.fn(),
  UpdateVideoSchema: {},
}));

import { query } from '@/lib/db';
import { getAuthUser, type JWTPayload } from '@/middleware/auth';
import { validateInput } from '@/lib/validation';

describe('Videos API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PUT /api/videos/[id]', () => {
    it('returns 401 when user is not authenticated', async () => {
      vi.mocked(getAuthUser).mockReturnValue(null);
      const { PUT } = await import('@/app/api/videos/[id]/route');

      const request = new NextRequest('http://localhost:3000/api/videos/video-123', {
        method: 'PUT',
        body: JSON.stringify({ title: 'New title' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'video-123' }) });
      expect(response.status).toBe(401);
    });

    it('returns 404 when video is missing', async () => {
      vi.mocked(getAuthUser).mockReturnValue({ userId: 'user-1', email: 'demo@example.com' } as JWTPayload);
      vi.mocked(validateInput).mockReturnValue({ title: 'Updated title' } as { title?: string });
      vi.mocked(query).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const { PUT } = await import('@/app/api/videos/[id]/route');

      const request = new NextRequest('http://localhost:3000/api/videos/video-123', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated title' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'video-123' }) });
      expect(response.status).toBe(404);
    });

    it('updates video when payload is valid', async () => {
      vi.mocked(getAuthUser).mockReturnValue({ userId: 'user-1', email: 'demo@example.com' } as JWTPayload);
      vi.mocked(validateInput).mockReturnValue({ title: 'Updated title', views: 42 } as { title?: string; views?: number });
      vi.mocked(query)
        .mockResolvedValueOnce({ rows: [{ id: 'video-123' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ id: 'video-123', title: 'Updated title' }], rowCount: 1 });
      const { PUT } = await import('@/app/api/videos/[id]/route');

      const request = new NextRequest('http://localhost:3000/api/videos/video-123', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated title', views: 42 }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'video-123' }) });
      expect(response.status).toBe(200);
      expect(vi.mocked(query)).toHaveBeenCalledTimes(2);
    });
  });

  describe('DELETE /api/videos/[id]', () => {
    it('returns 401 when user is not authenticated', async () => {
      vi.mocked(getAuthUser).mockReturnValue(null);
      const { DELETE } = await import('@/app/api/videos/[id]/route');
      const request = new NextRequest('http://localhost:3000/api/videos/video-123', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'video-123' }) });
      expect(response.status).toBe(401);
    });

    it('returns 404 when video is missing', async () => {
      vi.mocked(getAuthUser).mockReturnValue({ userId: 'user-1', email: 'demo@example.com' } as JWTPayload);
      vi.mocked(query).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const { DELETE } = await import('@/app/api/videos/[id]/route');
      const request = new NextRequest('http://localhost:3000/api/videos/video-123', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'video-123' }) });
      expect(response.status).toBe(404);
    });

    it('returns 204 when video is deleted', async () => {
      vi.mocked(getAuthUser).mockReturnValue({ userId: 'user-1', email: 'demo@example.com' } as JWTPayload);
      vi.mocked(query).mockResolvedValueOnce({ rows: [{ id: 'video-123', title: 'Demo' }], rowCount: 1 });
      const { DELETE } = await import('@/app/api/videos/[id]/route');
      const request = new NextRequest('http://localhost:3000/api/videos/video-123', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'video-123' }) });
      expect(response.status).toBe(204);
    });
  });
});
