import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { authenticateUserOrService } from '@/middleware/serviceAuth';
import { withSecurityHeaders } from '@/middleware/auth';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { fetchUploadsPlaylistByChannelId, fetchPlaylistItems } from '@/lib/youtube/client';
import { getValidAccessToken } from '@/application/services/YouTubeIntegrationService';

export const dynamic = 'force-dynamic';

const SyncSchema = z.object({
  channelId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).optional(),
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
    const limit = data.limit ?? 20;

    const channels = await query(
      data.channelId
        ? `SELECT id, youtube_channel_id FROM channels WHERE id = $1 AND user_id = $2`
        : `SELECT id, youtube_channel_id FROM channels WHERE user_id = $1 AND youtube_channel_id IS NOT NULL`,
      data.channelId ? [data.channelId, userId] : [userId]
    );

    if (channels.rows.length === 0) {
      return withSecurityHeaders(NextResponse.json({ error: 'No hay canales con YouTube conectado' }, { status: 404 }));
    }

    const results: Array<{ channelId: string; youtubeChannelId: string; created: number; skipped: number }> = [];

    for (const channel of channels.rows) {
      const integration = await query(
        `SELECT id, access_token_enc, refresh_token_enc, token_expiry_at
         FROM youtube_integrations
         WHERE user_id = $1 AND youtube_channel_id = $2
         ORDER BY updated_at DESC
         LIMIT 1`,
        [userId, channel.youtube_channel_id]
      );

      if (integration.rows.length === 0) {
        results.push({ channelId: channel.id as string, youtubeChannelId: channel.youtube_channel_id as string, created: 0, skipped: 0 });
        continue;
      }

      const accessToken = await getValidAccessToken(integration.rows[0]);
      const uploads = await fetchUploadsPlaylistByChannelId(accessToken, channel.youtube_channel_id as string);
      const items = await fetchPlaylistItems(accessToken, uploads.uploadsPlaylistId, limit);

      const youtubeIds = items.map((item) => item.videoId).filter(Boolean) as string[];
      const existing = youtubeIds.length
        ? await query(
            `SELECT youtube_video_id FROM videos WHERE channel_id = $1 AND youtube_video_id = ANY($2::text[])`,
            [channel.id, youtubeIds]
          )
        : { rows: [] as Array<{ youtube_video_id: string }> };

      const existingSet = new Set(existing.rows.map((row) => row.youtube_video_id));
      let created = 0;
      let skipped = 0;

      for (const item of items) {
        if (!item.videoId) continue;
        if (existingSet.has(item.videoId)) {
          skipped += 1;
          continue;
        }
        await query(
          `INSERT INTO videos (channel_id, youtube_video_id, title, description, published_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            channel.id,
            item.videoId,
            item.title || 'Video',
            null,
            item.publishedAt || null,
          ]
        );
        created += 1;
      }

      results.push({
        channelId: channel.id as string,
        youtubeChannelId: channel.youtube_channel_id as string,
        created,
        skipped,
      });
    }

    return withSecurityHeaders(NextResponse.json({ results }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 }));
    }
    logger.error('[youtube.sync.videos] Error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al sincronizar videos' }, { status: 500 }));
  }
});
