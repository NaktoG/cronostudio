import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit } from '@/middleware/rateLimit';
import { NextRequest } from 'next/server';

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
    const handler = vi.fn(() => new Response('ok'));
    const limited = rateLimit({ maxRequests: 2, windowMs: 1000 })(handler);
    const req = new NextRequest('http://localhost/api/test');

    const res1 = await limited(req);
    const res2 = await limited(req);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('bloquea cuando excede límite', async () => {
    const handler = vi.fn(() => new Response('ok'));
    const limited = rateLimit({ maxRequests: 1, windowMs: 1000 })(handler);

    const firstReq = new NextRequest('http://localhost/api/test', {
      headers: {
        'x-forwarded-for': '1.1.1.1',
      },
    });
    const secondReq = new NextRequest('http://localhost/api/test', {
      headers: {
        'x-forwarded-for': '1.1.1.1',
      },
    });

    await limited(firstReq);
    const blocked = await limited(secondReq);
    expect(blocked.status).toBe(429);
  });
});
