import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { createRequest, TEST_IDS } from '@/__tests__/utils/testConstants';
import { USER_ROLE_COLLABORATOR, USER_ROLE_OWNER } from '@/domain/value-objects/UserRole';

type MockRouteHandler = (request: NextRequest, ...args: unknown[]) => Promise<Response> | Response;

vi.mock('@/middleware/auth', () => ({
  withAuth: (handler: MockRouteHandler) => async (request: NextRequest, ...args: unknown[]) => {
    const role = request.headers.get('x-role');
    if (!role) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    (request as { user: { userId: string; email: string; role: string } }).user = {
      userId: TEST_IDS.userId,
      email: 'test@example.com',
      role,
    };
    return handler(request, ...args);
  },
}));

describe('requireRoles middleware', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('permite acceso cuando el rol es owner', async () => {
    const { requireRoles } = await import('@/middleware/rbac');
    const handler = vi.fn(() => NextResponse.json({ ok: true }));
    const secured = requireRoles([USER_ROLE_OWNER])(handler);

    const request = createRequest('/api/secure', {
      headers: { 'x-role': USER_ROLE_OWNER },
    });

    const response = await secured(request);
    expect(response.status).toBe(200);
  });

  it('bloquea acceso cuando el rol no coincide', async () => {
    const { requireRoles } = await import('@/middleware/rbac');
    const handler = vi.fn(() => NextResponse.json({ ok: true }));
    const secured = requireRoles([USER_ROLE_OWNER])(handler);

    const request = createRequest('/api/secure', {
      headers: { 'x-role': USER_ROLE_COLLABORATOR },
    });

    const response = await secured(request);
    expect(response.status).toBe(403);
  });
});
