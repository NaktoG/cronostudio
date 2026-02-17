import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeTestId } from '@/__tests__/utils/testIds';
import { withEnv } from '@/__tests__/utils/env';
import { makeApiRequest, WEBHOOK_HEADER } from '@/__tests__/utils/requests';
import { makeQueryResult } from '@/__tests__/utils/db';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));
const TEST_SECRET = makeTestId('secret');

vi.mock('@/lib/config', () => ({
  config: {
    webhooks: {
      secret: TEST_SECRET,
    },
  },
}));
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));
vi.mock('@/middleware/auth', () => {
  const getAuthUser = vi.fn();
  return {
    getAuthUser,
    withSecurityHeaders: vi.fn((response: Response) => response),
  };
});

import { query } from '@/lib/db';
import { getAuthUser, type JWTPayload } from '@/middleware/auth';
import { authenticateUserOrService } from '@/middleware/serviceAuth';

describe('authenticateUserOrService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no auth and no secret provided', async () => {
    vi.mocked(getAuthUser).mockReturnValue(null);
    const request = makeApiRequest('/api/channels');

    const result = await authenticateUserOrService(request);
    expect(result.response?.status).toBe(401);
  });

  it('returns 401 when secret is invalid', async () => {
    vi.mocked(getAuthUser).mockReturnValue(null);
    const request = makeApiRequest('/api/channels', {
      headers: {
        [WEBHOOK_HEADER]: makeTestId('secret_invalid'),
      },
    });

    const result = await authenticateUserOrService(request);
    expect(result.response?.status).toBe(401);
  });

  it('returns 500 when service user is not configured', async () => {
    vi.mocked(getAuthUser).mockReturnValue(null);
    await withEnv({
      CRONOSTUDIO_SERVICE_USER_ID: undefined,
      CRONOSTUDIO_SERVICE_USER_EMAIL: undefined,
    }, async () => {
      const request = makeApiRequest('/api/channels', {
        headers: {
          [WEBHOOK_HEADER]: TEST_SECRET,
        },
      });

      const result = await authenticateUserOrService(request);
      expect(result.response?.status).toBe(500);
    });
  });

  it('returns userId when service secret is valid and user configured', async () => {
    vi.mocked(getAuthUser).mockReturnValue(null);
    const serviceUserId = makeTestId('user');
    vi.mocked(query).mockResolvedValueOnce(makeQueryResult([{ id: serviceUserId }]))

    await withEnv({
      CRONOSTUDIO_SERVICE_USER_ID: serviceUserId,
    }, async () => {
      const request = makeApiRequest('/api/channels', {
        headers: {
          [WEBHOOK_HEADER]: TEST_SECRET,
        },
      });

      const result = await authenticateUserOrService(request);
      if (result.response) {
        throw new Error('Expected service auth to succeed');
      }
      expect(result.userId).toBe(serviceUserId);
      expect(result.via).toBe('service');
    });
  });

  it('returns 403 when user is not owner for ownerOnly routes', async () => {
    const memberUser = {
      userId: makeTestId('user'),
      email: `${makeTestId('email')}@example.test`,
      role: 'collaborator',
    } as JWTPayload;
    vi.mocked(getAuthUser).mockReturnValue(memberUser);

    const request = makeApiRequest('/api/channels');
    const result = await authenticateUserOrService(request, { ownerOnly: true });
    expect(result.response?.status).toBe(403);
  });
});
