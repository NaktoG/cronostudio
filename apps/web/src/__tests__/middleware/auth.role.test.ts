import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const BASE_ENV = { ...process.env };

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(() => ({
      userId: 'user-1',
      email: 'user@example.com',
    })),
  },
}));

describe('auth middleware role validation', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...BASE_ENV,
      JWT_SECRET: 'x'.repeat(32),
      DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
    };
  });

  afterEach(() => {
    process.env = BASE_ENV;
  });

  it('returns 401 when JWT role is missing', async () => {
    const { withAuth } = await import('@/middleware/auth');
    const handler = vi.fn(() => NextResponse.json({ ok: true }));
    const secured = withAuth(handler);

    const request = new NextRequest('http://localhost/api/secure', {
      headers: { authorization: 'Bearer valid-token' },
    });

    const response = await secured(request, {} as never);

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });
});
