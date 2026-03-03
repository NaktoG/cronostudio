import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

const BASE_ENV = { ...process.env };

describe('webhook service user configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...BASE_ENV,
      JWT_SECRET: 'x'.repeat(32),
      DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
      CRONOSTUDIO_WEBHOOK_SECRET: 'secret-123',
    };
  });

  afterEach(() => {
    process.env = BASE_ENV;
  });

  it('returns 503 when service user is not configured', async () => {
    const { requireServiceSecret } = await import('@/middleware/webhook');
    const request = new NextRequest('http://localhost/api/automation-runs', {
      headers: { 'x-cronostudio-webhook-secret': 'secret-123' },
    });

    const result = requireServiceSecret(request, false);
    expect(result.response?.status).toBe(503);

    const body = await result.response?.json();
    expect(body).toEqual({ error: 'service_user_not_configured' });
  });
});
