import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient, getRateLimitKey } from '@/lib/redis';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // milliseconds
}

const fallbackStore = new Map<string, { count: number; resetTime: number }>();
function shouldEnforceRateLimit() {
  return process.env.NODE_ENV === 'production' || process.env.RATE_LIMIT_ENFORCE === 'true';
}
type RouteHandler<Context = unknown> = (request: NextRequest, context?: Context) => Promise<NextResponse> | NextResponse;

export function rateLimit(config: RateLimitConfig) {
  return <Context = unknown>(handler: RouteHandler<Context>): RouteHandler<Context> => {
    return async (request: NextRequest, context?: Context) => {
      if (!shouldEnforceRateLimit()) {
        return handler(request, context as Context);
      }

      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        'unknown';

      const identifier = `${request.nextUrl.pathname}:${ip}`;
      const retryAfter = await checkRateLimit(identifier, config);

      if (retryAfter > 0) {
        return NextResponse.json(
          {
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Try again later.',
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
            },
          }
        );
      }

      return handler(request, context);
    };
  };
}

export const API_RATE_LIMIT = { maxRequests: 100, windowMs: 15 * 60 * 1000 };
export const LOGIN_RATE_LIMIT = { maxRequests: 5, windowMs: 15 * 60 * 1000 };
export const FILE_UPLOAD_RATE_LIMIT = { maxRequests: 10, windowMs: 60 * 60 * 1000 };

async function checkRateLimit(identifier: string, config: RateLimitConfig): Promise<number> {
  const redis = getRedisClient();
  if (redis) {
    const key = getRateLimitKey(['rl', identifier]);
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.pexpire(key, config.windowMs);
    }
    if (current > config.maxRequests) {
      const ttl = await redis.pttl(key);
      return Math.ceil(Math.max(ttl, 0) / 1000);
    }
    return 0;
  }

  const now = Date.now();
  const record = fallbackStore.get(identifier);
  if (record && now < record.resetTime) {
    if (record.count >= config.maxRequests) {
      return Math.ceil((record.resetTime - now) / 1000);
    }
    record.count += 1;
    return 0;
  }

  fallbackStore.set(identifier, {
    count: 1,
    resetTime: now + config.windowMs,
  });
  return 0;
}
