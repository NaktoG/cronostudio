import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { withSecurityHeaders } from '@/middleware/auth';

const WEBHOOK_HEADER = 'x-cronostudio-webhook-secret';

export function requireWebhookSecret(request: NextRequest): NextResponse | null {
  const secret = config.webhooks.secret;
  if (!secret) return null;

  const provided = request.headers.get(WEBHOOK_HEADER);
  if (!provided || provided !== secret) {
    return withSecurityHeaders(NextResponse.json({ error: 'Webhook no autorizado' }, { status: 401 }));
  }

  return null;
}
