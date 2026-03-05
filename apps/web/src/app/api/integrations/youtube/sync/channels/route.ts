import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { authenticateUserOrService } from '@/middleware/serviceAuth';
import { withSecurityHeaders } from '@/middleware/auth';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { fetchChannelDetails } from '@/lib/youtube/client';
import { getValidAccessToken } from '@/application/services/YouTubeIntegrationService';

export const dynamic = 'force-dynamic';

const SyncSchema = z.object({
  youtubeChannelId: z.string().optional(),
});

// token refresh handled by service

export const POST = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const authResult = await authenticateUserOrService(request, { ownerOnly: true });
    if (authResult.response) return authResult.response;
    const { userId } = authResult;

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const data = SyncSchema.parse(body);

    const integrations = await query(
      data.youtubeChannelId
        ? `SELECT id, youtube_channel_id, access_token_enc, refresh_token_enc, token_expiry_at
           FROM youtube_integrations
           WHERE user_id = $1 AND youtube_channel_id = $2
           ORDER BY updated_at DESC
           LIMIT 1`
        : `SELECT id, youtube_channel_id, access_token_enc, refresh_token_enc, token_expiry_at
           FROM youtube_integrations
           WHERE user_id = $1
           ORDER BY updated_at DESC`,
      data.youtubeChannelId ? [userId, data.youtubeChannelId] : [userId]
    );

    if (integrations.rows.length === 0) {
      return withSecurityHeaders(NextResponse.json({ error: 'YouTube no conectado' }, { status: 404 }));
    }

    const results: Array<{ youtubeChannelId: string; channelId: string; status: 'created' | 'updated' }> = [];

    for (const row of integrations.rows) {
      const accessToken = await getValidAccessToken(row);
      const details = await fetchChannelDetails(accessToken, row.youtube_channel_id as string);

      const existing = await query(
        `SELECT id FROM channels WHERE user_id = $1 AND youtube_channel_id = $2 LIMIT 1`,
        [userId, details.id]
      );

      let channelId: string;
      let status: 'created' | 'updated' = 'created';

      if (existing.rows.length > 0) {
        channelId = existing.rows[0].id as string;
        status = 'updated';
        await query(
          `UPDATE channels
           SET name = $1, subscribers = $2, updated_at = NOW()
           WHERE id = $3 AND user_id = $4`,
          [details.title ?? 'Canal', details.subscribers, channelId, userId]
        );
      } else {
        const inserted = await query(
          `INSERT INTO channels (user_id, name, youtube_channel_id, subscribers)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [userId, details.title ?? 'Canal', details.id, details.subscribers]
        );
        channelId = inserted.rows[0].id as string;
      }

      await query(
        `UPDATE youtube_integrations
         SET channel_id = $1, updated_at = NOW()
         WHERE id = $2`,
        [channelId, row.id]
      );

      results.push({ youtubeChannelId: details.id, channelId, status });
    }

    return withSecurityHeaders(NextResponse.json({ results }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 }));
    }
    logger.error('[youtube.sync.channels] Error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al sincronizar canales' }, { status: 500 }));
  }
});
