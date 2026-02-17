import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { withSecurityHeaders } from '@/middleware/auth';
import { logger } from '@/lib/logger';

const WEBHOOK_HEADER = 'x-cronostudio-webhook-secret';

function getRequestId(request: NextRequest): string | null {
  return (
    request.headers.get('x-request-id') ||
    request.headers.get('x-vercel-id') ||
    request.headers.get('x-amzn-trace-id')
  );
}

function getRequestIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

export function logWebhookAuthAttempt(request: NextRequest, status: number): void {
  logger.info('webhook.auth', {
    requestId: getRequestId(request),
    ip: getRequestIp(request),
    path: request.nextUrl.pathname,
    status,
  });
}

function isServiceSecretValid(secret: string, provided: string): boolean {
  if (secret.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
}

export function hasValidServiceSecret(request: NextRequest): boolean {
  const secret = config.webhooks.secret;
  if (!secret) return false;
  const provided = request.headers.get(WEBHOOK_HEADER);
  if (!provided) return false;
  return isServiceSecretValid(secret, provided);
}

export function requireServiceSecret(request: NextRequest, hasAuthUser: boolean): { response: NextResponse | null; viaServiceSecret: boolean } {
  const viaServiceSecret = hasValidServiceSecret(request);
  if (viaServiceSecret || hasAuthUser) {
    return { response: null, viaServiceSecret };
  }

  const response = withSecurityHeaders(NextResponse.json({ error: 'Webhook no autorizado' }, { status: 401 }));
  logWebhookAuthAttempt(request, response.status);
  return { response, viaServiceSecret: false };
}
