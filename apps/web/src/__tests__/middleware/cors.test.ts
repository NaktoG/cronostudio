import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRequest } from '@/__tests__/utils/testConstants';

describe('CORS middleware', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.CORS_ALLOWED_ORIGINS = 'http://allowed.test';
  });

  it('permite preflight desde origen permitido', async () => {
    const { middleware } = await import('../../../middleware');
    const request = createRequest('/api/channels', {
      method: 'OPTIONS',
      headers: {
        origin: 'http://allowed.test',
      },
    });

    const response = middleware(request);
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://allowed.test');
  });

  it('bloquea preflight desde origen no permitido', async () => {
    const { middleware } = await import('../../../middleware');
    const request = createRequest('/api/channels', {
      method: 'OPTIONS',
      headers: {
        origin: 'http://evil.test',
      },
    });

    const response = middleware(request);
    expect(response.status).toBe(403);
  });

  it('agrega headers CORS en requests normales con origen permitido', async () => {
    const { middleware } = await import('../../../middleware');
    const request = createRequest('/api/channels', {
      headers: {
        origin: 'http://allowed.test',
      },
    });

    const response = middleware(request);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://allowed.test');
  });
});
