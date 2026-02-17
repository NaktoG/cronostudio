import { describe, it, expect, vi, beforeAll } from 'vitest';
import { query } from '@/lib/db';

const queryMock = vi.fn(async () => ({ rows: [], rowCount: 0 }));
const connectMock = vi.fn(async () => ({ release: vi.fn() }));

type MockPoolInstance = {
  query: typeof queryMock;
  connect: typeof connectMock;
  on: ReturnType<typeof vi.fn>;
};

vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(function MockPool(this: MockPoolInstance) {
    this.query = queryMock;
    this.connect = connectMock;
    this.on = vi.fn();
  }),
}));

describe('lib/db', () => {
  beforeAll(() => {
    process.env.DATABASE_URL = 'postgresql://user:pass@db.example.com:5432/cronostudio';
    process.env.DB_SSL_REJECT_UNAUTHORIZED = 'false';
  });

  it('usa SSL cuando DATABASE_URL apunta a host remoto', async () => {
    const { Pool } = await import('pg');
    await import('@/lib/db');
    await query('SELECT 1');
    expect(Pool).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: expect.stringContaining('db.example.com'),
        ssl: { rejectUnauthorized: false },
      })
    );
  });
});
