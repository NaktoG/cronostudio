import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@/domain/entities/User';
import { withAuth, type AuthenticatedRequest } from '@/middleware/auth';

type RouteHandler = (request: NextRequest, ...args: unknown[]) => Promise<NextResponse> | NextResponse;

export function requireRoles(allowedRoles: User['role'][]): (handler: RouteHandler) => RouteHandler {
    return (handler: RouteHandler) =>
        withAuth(async (request: NextRequest, ...args: unknown[]) => {
            const currentUser = (request as AuthenticatedRequest).user;
            if (!currentUser || !allowedRoles.includes(currentUser.role)) {
                return NextResponse.json({ error: 'Forbidden', message: 'No tienes permisos suficientes' }, { status: 403 });
            }
            return handler(request, ...args);
        });
}
