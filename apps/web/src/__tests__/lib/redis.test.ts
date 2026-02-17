import { describe, it, expect, vi } from 'vitest';

type MockRedisInstance = {
  on: ReturnType<typeof vi.fn>;
};

const mockRedisClass = vi.fn().mockImplementation(function MockRedis(this: MockRedisInstance) {
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
    process.env.REDIS_URL = 'redis://localhost:6379';
    const { getRedisClient } = await import('@/lib/redis');
    expect(getRedisClient()).not.toBeNull();
    expect(mockRedisClass).toHaveBeenCalled();
  });
});
