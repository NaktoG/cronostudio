import { describe, expect, it, vi, afterEach } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe('secretBox', () => {
  it('encrypts and decrypts plaintext', async () => {
    process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');
    const { sealSecret, openSecret } = await import('@/lib/crypto/secretBox');

    const token = 'test-token-123';
    const sealed = sealSecret(token);
    const opened = openSecret(sealed);

    expect(opened).toBe(token);
  });

  it('fails on tampered payload', async () => {
    process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY = Buffer.from('b'.repeat(32)).toString('base64');
    const { sealSecret, openSecret } = await import('@/lib/crypto/secretBox');

    const sealed = sealSecret('secret');
    const parsed = JSON.parse(sealed) as { iv: string; tag: string; data: string };
    const tampered = {
      ...parsed,
      data: parsed.data.slice(0, -2) + 'aa',
    };

    expect(() => openSecret(JSON.stringify(tampered))).toThrow();
  });

  it('throws for invalid key length', async () => {
    process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY = Buffer.from('short-key').toString('base64');
    const { sealSecret } = await import('@/lib/crypto/secretBox');

    expect(() => sealSecret('secret')).toThrow('YOUTUBE_TOKEN_ENCRYPTION_KEY must be base64 for 32 bytes.');
  });
});
