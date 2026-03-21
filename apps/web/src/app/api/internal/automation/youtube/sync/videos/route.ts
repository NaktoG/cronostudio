import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurityHeaders } from '@/middleware/auth';
import { requireWebhookSecret } from '@/middleware/webhook';
import { rateLimit } from '@/middleware/rateLimit';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';
import { syncYouTubeVideosForUser } from '@/application/services/YouTubeVideoSyncService';

export const dynamic = 'force-dynamic';

const InternalSyncVideosSchema = z.object({
  tenantUserId: z.string().uuid(),
  channelId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

const INTERNAL_BATCH_RATE_LIMIT = {
	maxRequests: 5000,
	windowMs: 15 * 60 * 1000,
};

export const POST = rateLimit(INTERNAL_BATCH_RATE_LIMIT)(async (request: NextRequest) => {
  if (!config.webhooks.secret) {
    return withSecurityHeaders(
      NextResponse.json({ error: 'service_secret_not_configured' }, { status: 503 })
    );
  }

  const unauthorized = requireWebhookSecret(request);
  if (unauthorized) return unauthorized;

  try {
    let payload: unknown = {};
    try {
      payload = await request.json();
    } catch {
      return withSecurityHeaders(
        NextResponse.json({ error: 'Datos invalidos', details: ['Invalid JSON body'] }, { status: 400 })
      );
    }

    const data = InternalSyncVideosSchema.parse(payload);

    const results = await syncYouTubeVideosForUser(data.tenantUserId, {
      channelId: data.channelId,
      limit: data.limit,
    });

    return withSecurityHeaders(NextResponse.json({ results }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withSecurityHeaders(
        NextResponse.json({ error: 'Datos invalidos', details: error.errors }, { status: 400 })
      );
    }

    logger.error('[internal.automation.youtube.sync.videos] Error', { error: String(error) });
    return withSecurityHeaders(
      NextResponse.json({ error: 'Error al sincronizar videos internos' }, { status: 500 })
    );
  }
});
