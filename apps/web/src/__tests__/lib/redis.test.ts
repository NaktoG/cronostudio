import { describe, it, expect, vi } from 'vitest';
import { TEST_REDIS_URL } from '@/__tests__/utils/testConstants';

const mockRedisClass = vi.fn().mockImplementation(function MockRedis() {
  this.on = vi.fn();
});

vi.mock('ioredis', () => ({
  default: mockRedisClass,
}));

describe('lib/redis', () => {
  it('no instancia cliente sin REDIS_URL', async () => {
    delete process.env.REDIS_URL;
    const { getRedisClient } = await import('@/lib/redis');
    expect(getRedisClient()).toBeNull();
  });

  it('instancia cliente cuando REDIS_URL existe', async () => {
    process.env.REDIS_URL = TEST_REDIS_URL;
    const { getRedisClient } = await import('@/lib/redis');
    expect(getRedisClient()).not.toBeNull();
    expect(mockRedisClass).toHaveBeenCalled();
  });
});
