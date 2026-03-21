import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { authenticateUserOrService } from '@/middleware/serviceAuth';
import { hasValidServiceSecret } from '@/middleware/webhook';
import { withSecurityHeaders } from '@/middleware/auth';
import { logger } from '@/lib/logger';
import { syncYouTubeChannelsForUser } from '@/application/services/YouTubeSyncService';
import { decideAutomationCutover } from '@/lib/automation/cutover';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SyncSchema = z.object({
  youtubeChannelId: z.string().optional(),
});

const SHADOW_ENABLED = process.env.AUTOMATION_SHADOW_CHANNELS_ENABLED === 'true';

// token refresh handled by service

export const POST = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const authResult = await authenticateUserOrService(request, { ownerOnly: true });
    if (authResult.response) return authResult.response;
    const { userId, via } = authResult;

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const data = SyncSchema.parse(body);

    const requestId = request.headers.get('x-request-id') || null;
    const cutover = decideAutomationCutover(userId, 'youtube.sync.channels', via, {
      serviceIntent: hasValidServiceSecret(request),
    });
    if (cutover.mode === 'queue_only') {
      try {
        const cutoverPayload: Record<string, unknown> = { source: 'cutover' };
        if (data.youtubeChannelId) {
          cutoverPayload.youtubeChannelId = data.youtubeChannelId;
        }

        const jobId = randomUUID();
        await query(
          `INSERT INTO automation_job_queue (id, job_type, tenant_user_id, payload, state, priority, attempt, max_attempts, run_at, request_id, trace_id)
           VALUES ($1, 'youtube.sync.channels', $2, $3::jsonb, 'queued', 100, 0, 5, NOW(), $4, $5)`,
          [
            jobId,
            userId,
            JSON.stringify(cutoverPayload),
            requestId,
            requestId,
          ]
        );

        logger.info('[youtube.sync.channels] Cutover queue_only', {
          userId,
          via,
          percent: cutover.percent,
          bucket: cutover.bucket,
          reason: cutover.reason,
          queuedJobId: jobId,
          requestId,
        });

        const response = NextResponse.json({
          accepted: true,
          mode: 'automation-go',
          queuedJobId: jobId,
        }, { status: 202 });
        response.headers.set('x-automation-cutover', 'queue_only');
        return withSecurityHeaders(response);
      } catch (enqueueError) {
        logger.warn('[youtube.sync.channels] Cutover enqueue failed; fallback to legacy', {
          userId,
          via,
          error: String(enqueueError),
          percent: cutover.percent,
          bucket: cutover.bucket,
          requestId,
        });
      }
    }

    const results = await syncYouTubeChannelsForUser(userId, data.youtubeChannelId);
    if (results.length === 0) {
      return withSecurityHeaders(new NextResponse(null, { status: 204 }));
    }

    if (SHADOW_ENABLED) {
      try {
        const shadowPayload: Record<string, unknown> = { source: 'shadow' };
        if (data.youtubeChannelId) {
          shadowPayload.youtubeChannelId = data.youtubeChannelId;
        }

        await query(
          `INSERT INTO automation_job_queue (id, job_type, tenant_user_id, payload, state, priority, attempt, max_attempts, run_at, request_id, trace_id)
           VALUES ($1, 'youtube.sync.channels', $2, $3::jsonb, 'queued', 100, 0, 5, NOW(), $4, $5)`,
          [
            randomUUID(),
            userId,
            JSON.stringify(shadowPayload),
            requestId,
            requestId,
          ]
        );
      } catch (enqueueError) {
        logger.warn('[youtube.sync.channels] Shadow enqueue failed', { error: String(enqueueError) });
      }
    }

    logger.info('[youtube.sync.channels] Legacy sync', {
      userId,
      via,
      percent: cutover.percent,
      bucket: cutover.bucket,
      reason: cutover.reason,
      requestId,
    });

    const response = NextResponse.json({ results });
    response.headers.set('x-automation-cutover', 'legacy_sync');
    return withSecurityHeaders(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 }));
    }
    logger.error('[youtube.sync.channels] Error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al sincronizar canales' }, { status: 500 }));
  }
});
