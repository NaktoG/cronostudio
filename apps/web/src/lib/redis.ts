import Redis from 'ioredis';
import { config } from '@/lib/config';

let client: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (client) {
    return client;
  }

  const options: Redis.RedisOptions = {
    maxRetriesPerRequest: 2,
    enableReadyCheck: false,
  };

  if (process.env.REDIS_URL.startsWith('rediss://')) {
    options.tls = { rejectUnauthorized: false };
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
