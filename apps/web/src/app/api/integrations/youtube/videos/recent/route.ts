import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { logger } from '@/lib/logger';
import { fetchPlaylistItems, fetchUploadsPlaylist } from '@/lib/youtube/client';
import { getIntegrationForUserChannel, getLatestIntegrationForUser, getValidAccessToken } from '@/application/services/YouTubeIntegrationService';

export const dynamic = 'force-dynamic';

function buildVideoUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export const GET = withAuth(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = (await getAuthUser(request))?.userId ?? null;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 50);
    const youtubeChannelId = searchParams.get('youtubeChannelId');

    const integration = youtubeChannelId
      ? await getIntegrationForUserChannel(userId, youtubeChannelId)
      : await getLatestIntegrationForUser(userId);

    if (!integration) {
      return withSecurityHeaders(NextResponse.json({ error: 'YouTube no conectado' }, { status: 404 }));
    }

    const accessToken = await getValidAccessToken(integration);

    const uploads = await fetchUploadsPlaylist(accessToken);
    if (youtubeChannelId && uploads.channelId !== youtubeChannelId) {
      return withSecurityHeaders(NextResponse.json({ error: 'Canal no coincide' }, { status: 400 }));
    }

    const items = await fetchPlaylistItems(accessToken, uploads.uploadsPlaylistId, limit);
    const normalizedItems = items.filter((item): item is { videoId: string; title: string | undefined; publishedAt: string } => (
      Boolean(item.videoId && item.publishedAt)
    ));

    return withSecurityHeaders(NextResponse.json({
      youtubeChannelId: uploads.channelId,
      items: normalizedItems.map((item) => ({
        videoId: item.videoId,
        title: item.title ?? 'Video',
        publishedAt: item.publishedAt,
        url: buildVideoUrl(item.videoId),
      })),
    }));
  } catch (error) {
    logger.error('[youtube.recent] Error', { message: error instanceof Error ? error.message : String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener videos' }, { status: 500 }));
  }
}));
