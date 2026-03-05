import { describe, expect, it, vi, afterEach } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe('config env validation', () => {
  it('loads config when required envs are present', async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_secret_change_me_32_chars_min____';
    process.env.DATABASE_URL = 'postgresql://USER:PASSWORD@localhost:5432/cronostudio_test';

    const configModule = await import('@/lib/config');
    const config = configModule.getConfig();
    expect(config.jwt.secret).toBe(process.env.JWT_SECRET);
    expect(config.database.url).toBe(process.env.DATABASE_URL);
  });

  it('throws when JWT_SECRET is missing', async () => {
    delete process.env.JWT_SECRET;
    process.env.DATABASE_URL = 'postgresql://USER:PASSWORD@localhost:5432/cronostudio_test';

    await expect(import('@/lib/config')).rejects.toThrow(
      'Missing or invalid environment variables: JWT_SECRET.'
    );
  });

  it('throws when DATABASE_URL and POSTGRES_* are missing', async () => {
    process.env.JWT_SECRET = 'test_secret_change_me_32_chars_min____';
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_HOST;
    delete process.env.POSTGRES_PORT;
    delete process.env.POSTGRES_DB;
    delete process.env.POSTGRES_USER;
    delete process.env.POSTGRES_PASSWORD;

    await expect(import('@/lib/config')).rejects.toThrow(
      'Missing required database environment variables:'
    );
  });
});
