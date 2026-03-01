import { describe, expect, it, vi, afterEach } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe('youtube oauth lazy env', () => {
  it('does not throw on module import without envs', async () => {
    delete process.env.YOUTUBE_OAUTH_CLIENT_ID;
    delete process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
    delete process.env.YOUTUBE_OAUTH_REDIRECT_URI;

    await expect(import('@/lib/youtube/oauth')).resolves.toBeDefined();
    await expect(import('@/lib/youtube/client')).resolves.toBeDefined();
  });

  it('throws when calling buildAuthUrl without required envs', async () => {
    delete process.env.YOUTUBE_OAUTH_CLIENT_ID;
    delete process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
    delete process.env.YOUTUBE_OAUTH_REDIRECT_URI;

    const { buildAuthUrl } = await import('@/lib/youtube/oauth');
    expect(() => buildAuthUrl('state', 'challenge')).toThrow('Missing YOUTUBE_OAUTH_CLIENT_ID');
  });
});
