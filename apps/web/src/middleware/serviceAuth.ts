import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, withSecurityHeaders, type JWTPayload } from '@/middleware/auth';
import { requireServiceSecret, logWebhookAuthAttempt } from '@/middleware/webhook';
import { resolveServiceUserId } from '@/lib/serviceUser';
import { logger } from '@/lib/logger';
import { USER_ROLE_OWNER } from '@/domain/value-objects/UserRole';

export type ServiceAuthResult = {
    response: NextResponse | null;
    userId: string | null;
    viaServiceSecret: boolean;
    authUser: JWTPayload | null;
};

export async function requireServiceOrOwner(request: NextRequest): Promise<ServiceAuthResult> {
    const authUser = getAuthUser(request);
    const webhookGuard = requireServiceSecret(request, Boolean(authUser));

    if (webhookGuard.response) {
        return { response: webhookGuard.response, userId: null, viaServiceSecret: false, authUser: authUser ?? null };
    }

    if (authUser && authUser.role !== USER_ROLE_OWNER && !webhookGuard.viaServiceSecret) {
        const response = withSecurityHeaders(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
        logWebhookAuthAttempt(request, response.status);
        return { response, userId: null, viaServiceSecret: false, authUser };
    }

    if (webhookGuard.viaServiceSecret) {
        const serviceUserId = await resolveServiceUserId();
        if (!serviceUserId) {
            logger.error('service_user.resolve.failed', { path: request.nextUrl.pathname });
            const response = withSecurityHeaders(NextResponse.json({ error: 'Service user misconfigured' }, { status: 500 }));
            return { response, userId: null, viaServiceSecret: true, authUser: authUser ?? null };
        }

        return { response: null, userId: serviceUserId, viaServiceSecret: true, authUser: authUser ?? null };
    }

    if (!authUser) {
        const response = withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
        return { response, userId: null, viaServiceSecret: false, authUser: null };
    }

    return { response: null, userId: authUser.userId, viaServiceSecret: false, authUser };
}
