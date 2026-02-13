import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

type MockRouteHandler = (request: NextRequest, ...args: unknown[]) => Promise<Response> | Response;

vi.mock('@/middleware/auth', () => ({
  withAuth: (handler: MockRouteHandler) => async (request: NextRequest, ...args: unknown[]) => {
    const role = request.headers.get('x-role');
    if (!role) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    (request as { user: { userId: string; email: string; role: string } }).user = {
      userId: 'user-1',
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
    const secured = requireRoles(['owner'])(handler);

    const request = new NextRequest('http://localhost/api/secure', {
      headers: { 'x-role': 'owner' },
    });

    const response = await secured(request);
    expect(response.status).toBe(200);
  });

  it('bloquea acceso cuando el rol no coincide', async () => {
    const { requireRoles } = await import('@/middleware/rbac');
    const handler = vi.fn(() => NextResponse.json({ ok: true }));
    const secured = requireRoles(['owner'])(handler);

    const request = new NextRequest('http://localhost/api/secure', {
      headers: { 'x-role': 'collaborator' },
    });

    const response = await secured(request);
    expect(response.status).toBe(403);
  });
});
