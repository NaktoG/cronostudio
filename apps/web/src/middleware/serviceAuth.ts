import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, type JWTPayload, withSecurityHeaders } from '@/middleware/auth';
import { hasValidServiceSecret, logWebhookAuthAttempt } from '@/middleware/webhook';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

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

async function resolveServiceUserId(): Promise<{ userId: string | null; reason?: 'missing_config' | 'not_found' }> {
  const serviceUserId = process.env.CRONOSTUDIO_SERVICE_USER_ID?.trim();
  const serviceUserEmail = process.env.CRONOSTUDIO_SERVICE_USER_EMAIL?.trim();

  if (!serviceUserId && !serviceUserEmail) {
    return { userId: null, reason: 'missing_config' };
  }

  if (serviceUserId) {
    const result = await query(
      `SELECT id
       FROM app_users
       WHERE id = $1
       LIMIT 1`,
      [serviceUserId]
    );
    return result.rows.length > 0
      ? { userId: result.rows[0].id as string }
      : { userId: null, reason: 'not_found' };
  }

  const result = await query(
    `SELECT id
     FROM app_users
     WHERE email = $1
     LIMIT 1`,
    [serviceUserEmail]
  );

  return result.rows.length > 0
    ? { userId: result.rows[0].id as string }
    : { userId: null, reason: 'not_found' };
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

  const serviceUser = await resolveServiceUserId();
  if (!serviceUser.userId) {
    const errorMessage = serviceUser.reason === 'missing_config'
      ? 'Service user not configured'
      : 'Service user not found';
    logger.error('service_auth.resolve_user_failed', {
      reason: serviceUser.reason ?? 'unknown',
      path: request.nextUrl.pathname,
    });
    return { response: buildErrorResponse(500, errorMessage) };
  }

  return { response: null, userId: serviceUser.userId, via: 'service' };
}
