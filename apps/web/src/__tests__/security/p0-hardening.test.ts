import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const BASE_ENV = { ...process.env };

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(() => ({
      userId: 'user-123',
      email: 'owner@cronostudio.com',
      role: 'owner',
    })),
  },
}));

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('@/lib/observability', () => ({
  emitMetric: vi.fn(),
}));

describe('P0 security hardening guards', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...BASE_ENV,
      NODE_ENV: 'production',
      JWT_SECRET: 'x'.repeat(32),
      DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
      CSRF_ENFORCE: 'true',
    };
  });

  afterEach(() => {
    process.env = BASE_ENV;
  });

  it('rejects cookie-authenticated mutation requests without csrf token', async () => {
    const { getAuthUser } = await import('@/middleware/auth');
    const request = new NextRequest('http://localhost/api/secure', {
      method: 'POST',
      headers: {
        cookie: 'access_token=token-123; csrf_token=csrf-abc',
      },
    });

    const payload = await getAuthUser(request);
    expect(payload).toBeNull();
  });

  it('accepts bearer-authenticated mutation requests without csrf token', async () => {
    const { getAuthUser } = await import('@/middleware/auth');
    const request = new NextRequest('http://localhost/api/secure', {
      method: 'POST',
      headers: {
        authorization: 'Bearer token-123',
      },
    });

    const payload = await getAuthUser(request);
    expect(payload).toMatchObject({ userId: 'user-123', role: 'owner' });
  });

  it('keeps public signup disabled by default in production', async () => {
    delete process.env.ALLOW_PUBLIC_SIGNUP;
    vi.doMock('@/middleware/rateLimit', () => ({
      LOGIN_RATE_LIMIT: { windowMs: 60_000, max: 5 },
      rateLimit: () => (handler: unknown) => handler,
      enforceRateLimit: vi.fn(async () => null),
    }));
    const { POST } = await import('@/app/api/auth/register/route');

    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      }),
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });
});
