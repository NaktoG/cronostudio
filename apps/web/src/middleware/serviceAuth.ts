import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, type JWTPayload, withSecurityHeaders } from '@/middleware/auth';
import { hasValidServiceSecret, logWebhookAuthAttempt } from '@/middleware/webhook';
import { logger } from '@/lib/logger';
import { resolveServiceUserId } from '@/lib/serviceUser';

type ServiceAuthOptions = {
  ownerOnly?: boolean;
  requireAuth?: boolean;
};

type ServiceAuthSuccess = {
  response: null;
  userId: string;
  via: 'user' | 'service';
  authUser?: JWTPayload;
};

type ServiceAuthFailure = {
  response: NextResponse;
};

export type ServiceAuthResult = ServiceAuthSuccess | ServiceAuthFailure;

function buildErrorResponse(status: number, error: string): NextResponse {
  return withSecurityHeaders(NextResponse.json({ error }, { status }));
}

export async function authenticateUserOrService(request: NextRequest, options: ServiceAuthOptions = {}): Promise<ServiceAuthResult> {
  const ownerOnly = options.ownerOnly ?? false;
  const requireAuth = options.requireAuth ?? true;

  const authUser = getAuthUser(request);
  if (authUser) {
    if (ownerOnly && authUser.role !== 'owner') {
      const response = buildErrorResponse(403, 'Forbidden');
      logWebhookAuthAttempt(request, response.status);
      return { response };
    }
    return { response: null, userId: authUser.userId, via: 'user', authUser };
  }

  if (!requireAuth) {
    return { response: buildErrorResponse(401, 'No autorizado') };
  }

  if (!hasValidServiceSecret(request)) {
    const response = buildErrorResponse(401, 'No autorizado');
    logWebhookAuthAttempt(request, response.status);
    return { response };
  }

  const serviceUserId = await resolveServiceUserId();
  if (!serviceUserId) {
    logger.error('service_auth.resolve_user_failed', {
      reason: 'misconfigured',
      path: request.nextUrl.pathname,
    });
    return { response: buildErrorResponse(500, 'Service user misconfigured') };
  }

  return { response: null, userId: serviceUserId, via: 'service' };
}
