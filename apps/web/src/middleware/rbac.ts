import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@/domain/entities/User';
import { withAuth, type AuthenticatedRequest } from '@/middleware/auth';
import { hasValidServiceSecret } from '@/middleware/webhook';

type RouteContext = { params: Promise<Record<string, string>> };
type RouteHandler<Context = RouteContext> = (request: NextRequest, context: Context) => Promise<NextResponse> | NextResponse;

export function requireRoles(allowedRoles: User['role'][]): <Context = RouteContext>(handler: RouteHandler<Context>) => RouteHandler<Context> {
    return <Context = RouteContext>(handler: RouteHandler<Context>) =>
        withAuth(async (request: NextRequest, context: Context) => {
            const currentUser = (request as AuthenticatedRequest).user;
            if (!currentUser || !allowedRoles.includes(currentUser.role)) {
                return NextResponse.json({ error: 'Forbidden', message: 'No tienes permisos suficientes' }, { status: 403 });
            }
            return handler(request, context);
        });
}

export function requireRolesOrServiceSecret(allowedRoles: User['role'][]): <Context = RouteContext>(handler: RouteHandler<Context>) => RouteHandler<Context> {
    return <Context = RouteContext>(handler: RouteHandler<Context>) =>
        async (request: NextRequest, context: Context) => {
            if (hasValidServiceSecret(request)) {
                return handler(request, context);
            }

            return withAuth(async (authRequest: NextRequest, authContext: Context) => {
                const currentUser = (authRequest as AuthenticatedRequest).user;
                if (!currentUser || !allowedRoles.includes(currentUser.role)) {
                    return NextResponse.json({ error: 'Forbidden', message: 'No tienes permisos suficientes' }, { status: 403 });
                }
                return handler(authRequest, authContext);
            })(request, context);
        };
}
