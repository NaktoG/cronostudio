import Redis, { RedisOptions } from 'ioredis';
import { config } from '@/lib/config';

let client: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    if (config.isProduction) {
      throw new Error('REDIS_URL must be configured in production before using Redis utilities');
    }
    return null;
  }

  if (client) {
    return client;
  }

  const options: RedisOptions = {
    maxRetriesPerRequest: 2,
    enableReadyCheck: false,
  };

  if (process.env.REDIS_URL.startsWith('rediss://')) {
    const skipVerification = process.env.REDIS_SKIP_TLS_VERIFY === 'true';
    options.tls = { rejectUnauthorized: !skipVerification };

    if (skipVerification && config.isProduction) {
      throw new Error('REDIS_SKIP_TLS_VERIFY cannot be true in production');
    }
    if (skipVerification) {
      console.warn('[Redis] TLS verification disabled via REDIS_SKIP_TLS_VERIFY. Do not use in production.');
    }
  }

  client = new Redis(process.env.REDIS_URL, options);
  client.on('error', (error) => {
    if (config.isProduction) {
      console.error('[Redis] connection error', error);
    }
  });

  return client;
}

export function getRateLimitKey(parts: string[]): string {
  return ['cronostudio', ...parts].join(':');
}
