import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit } from '@/middleware/rateLimit';
import { NextRequest, NextResponse } from 'next/server';
import { makeApiRequest } from '@/__tests__/utils/requests';

vi.mock('@/lib/redis', () => ({
  getRedisClient: () => null,
  getRateLimitKey: () => 'key',
}));

describe('rateLimit middleware', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    process.env.RATE_LIMIT_ENFORCE = 'true';
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.RATE_LIMIT_ENFORCE;
  });

  it('permitir solicitudes dentro del límite', async () => {
    const handler = vi.fn(() => NextResponse.json({ ok: true }));
    const limited = rateLimit({ maxRequests: 2, windowMs: 1000 })(handler);
    const req = makeApiRequest('/api/test');
    const context = { params: Promise.resolve({}) };

    const res1 = await limited(req, context);
    const res2 = await limited(req, context);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('bloquea cuando excede límite', async () => {
    const handler = vi.fn(() => NextResponse.json({ ok: true }));
    const limited = rateLimit({ maxRequests: 1, windowMs: 1000 })(handler);
    const context = { params: Promise.resolve({}) };

    const firstReq = makeApiRequest('/api/test', {
      headers: {
        'x-forwarded-for': '1.1.1.1',
      },
    });
    const secondReq = makeApiRequest('/api/test', {
      headers: {
        'x-forwarded-for': '1.1.1.1',
      },
    });

    await limited(firstReq, context);
    const blocked = await limited(secondReq, context);
    expect(blocked.status).toBe(429);
  });
});
