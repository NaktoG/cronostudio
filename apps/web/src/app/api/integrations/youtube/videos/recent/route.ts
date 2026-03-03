import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { openSecret } from '@/lib/crypto/secretBox';
import { fetchPlaylistItems, fetchUploadsPlaylist, refreshAccessToken } from '@/lib/youtube/client';

export const dynamic = 'force-dynamic';

function buildVideoUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export const GET = withAuth(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = getAuthUser(request)?.userId ?? null;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 50);
    const youtubeChannelId = searchParams.get('youtubeChannelId');

    const integration = await query(
      youtubeChannelId
        ? `SELECT id, youtube_channel_id, access_token_enc, refresh_token_enc, token_expiry_at, scope
           FROM youtube_integrations
           WHERE user_id = $1 AND youtube_channel_id = $2
           ORDER BY updated_at DESC
           LIMIT 1`
        : `SELECT id, youtube_channel_id, access_token_enc, refresh_token_enc, token_expiry_at, scope
           FROM youtube_integrations
           WHERE user_id = $1
           ORDER BY updated_at DESC
           LIMIT 1`,
      youtubeChannelId ? [userId, youtubeChannelId] : [userId]
    );

    if (integration.rows.length === 0) {
      return withSecurityHeaders(NextResponse.json({ error: 'YouTube no conectado' }, { status: 404 }));
    }

    const row = integration.rows[0];
    let accessToken = openSecret(row.access_token_enc as string);

    const expiry = row.token_expiry_at ? new Date(row.token_expiry_at as string) : null;
    if (expiry && expiry.getTime() <= Date.now() + 60 * 1000) {
      if (!row.refresh_token_enc) {
        return withSecurityHeaders(NextResponse.json({ error: 'Refresh token faltante' }, { status: 400 }));
      }
      const refreshed = await refreshAccessToken(row.refresh_token_enc as string);
      accessToken = openSecret(refreshed.accessTokenEnc);
      const nextExpiry = refreshed.expiresIn ? new Date(Date.now() + refreshed.expiresIn * 1000) : null;
      await query(
        `UPDATE youtube_integrations
         SET access_token_enc = $1, token_expiry_at = $2, scope = COALESCE($3, scope), updated_at = NOW()
         WHERE id = $4`,
        [refreshed.accessTokenEnc, nextExpiry?.toISOString() ?? null, refreshed.scope ?? null, row.id]
      );
    }

    const uploads = await fetchUploadsPlaylist(accessToken);
    if (youtubeChannelId && uploads.channelId !== youtubeChannelId) {
      return withSecurityHeaders(NextResponse.json({ error: 'Canal no coincide' }, { status: 400 }));
    }

    const items = await fetchPlaylistItems(accessToken, uploads.uploadsPlaylistId, limit);

    return withSecurityHeaders(NextResponse.json({
      youtubeChannelId: uploads.channelId,
      items: items.map((item: { videoId: string; title: string; publishedAt: string }) => ({
        videoId: item.videoId,
        title: item.title,
        publishedAt: item.publishedAt,
        url: buildVideoUrl(item.videoId),
      })),
    }));
  } catch (error) {
    logger.error('[youtube.recent] Error', { message: error instanceof Error ? error.message : String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener videos' }, { status: 500 }));
  }
}));
