import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurityHeaders } from '@/middleware/auth';
import { requireWebhookSecret } from '@/middleware/webhook';
import { rateLimit } from '@/middleware/rateLimit';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';
import { ingestYouTubeDailyAnalyticsForUser } from '@/application/services/YouTubeAnalyticsIngestService';

export const dynamic = 'force-dynamic';

const IngestSchema = z.object({
  tenantUserId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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

    const data = IngestSchema.parse(payload);
    const result = await ingestYouTubeDailyAnalyticsForUser(data.tenantUserId, data.date);

    return withSecurityHeaders(NextResponse.json(result));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withSecurityHeaders(
        NextResponse.json({ error: 'Datos invalidos', details: error.errors }, { status: 400 })
      );
    }

    logger.error('[internal.automation.youtube.analytics.ingest-daily] Error', { error: String(error) });
    return withSecurityHeaders(
      NextResponse.json({ error: 'Error al ingerir analytics diarios' }, { status: 500 })
    );
  }
});
