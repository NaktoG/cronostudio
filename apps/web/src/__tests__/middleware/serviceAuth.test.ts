import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

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
vi.mock('@/middleware/auth', () => {
  const getAuthUser = vi.fn();
  return {
    getAuthUser,
    withSecurityHeaders: vi.fn((response: Response) => response),
  };
});

import { query } from '@/lib/db';
import { getAuthUser, type JWTPayload } from '@/middleware/auth';
import { authenticateUserOrService } from '@/middleware/serviceAuth';

describe('authenticateUserOrService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns 401 when no auth and no secret provided', async () => {
    vi.mocked(getAuthUser).mockReturnValue(null);
    const request = new NextRequest('http://localhost:3000/api/channels');

    const result = await authenticateUserOrService(request);
    expect(result.response?.status).toBe(401);
  });

  it('returns 401 when secret is invalid', async () => {
    vi.mocked(getAuthUser).mockReturnValue(null);
    const request = new NextRequest('http://localhost:3000/api/channels', {
      headers: {
        'x-cronostudio-webhook-secret': 'invalid-secret',
      },
    });

    const result = await authenticateUserOrService(request);
    expect(result.response?.status).toBe(401);
  });

  it('returns 500 when service user is not configured', async () => {
    vi.mocked(getAuthUser).mockReturnValue(null);
    delete process.env.CRONOSTUDIO_SERVICE_USER_ID;
    delete process.env.CRONOSTUDIO_SERVICE_USER_EMAIL;

    const request = new NextRequest('http://localhost:3000/api/channels', {
      headers: {
        'x-cronostudio-webhook-secret': 'test-secret',
      },
    });

    const result = await authenticateUserOrService(request);
    expect(result.response?.status).toBe(500);
  });

  it('returns userId when service secret is valid and user configured', async () => {
    vi.mocked(getAuthUser).mockReturnValue(null);
    process.env.CRONOSTUDIO_SERVICE_USER_ID = 'user_test_123';
    vi.mocked(query).mockResolvedValueOnce({ rows: [{ id: 'user_test_123' }], rowCount: 1 });

    const request = new NextRequest('http://localhost:3000/api/channels', {
      headers: {
        'x-cronostudio-webhook-secret': 'test-secret',
      },
    });

    const result = await authenticateUserOrService(request);
    if (result.response) {
      throw new Error('Expected service auth to succeed');
    }
    expect(result.userId).toBe('user_test_123');
    expect(result.via).toBe('service');
  });

  it('returns 403 when user is not owner for ownerOnly routes', async () => {
    const memberUser = { userId: 'user_test_456', email: 'member@example.com', role: 'member' } as JWTPayload;
    vi.mocked(getAuthUser).mockReturnValue(memberUser);

    const request = new NextRequest('http://localhost:3000/api/channels');
    const result = await authenticateUserOrService(request, { ownerOnly: true });
    expect(result.response?.status).toBe(403);
  });
});
