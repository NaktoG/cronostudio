import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { authenticateUserOrService } from '@/middleware/serviceAuth';
import { withSecurityHeaders } from '@/middleware/auth';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getIntegrationForUserChannel, getValidAccessToken } from '@/application/services/YouTubeIntegrationService';

export const dynamic = 'force-dynamic';

const AnalyticsSchema = z.object({
  videoId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function buildAnalyticsUrl(videoId: string, startDate: string, endDate: string) {
  const url = new URL('https://youtubeanalytics.googleapis.com/v2/reports');
  url.searchParams.set('ids', 'channel==MINE');
  url.searchParams.set('metrics', 'views,estimatedMinutesWatched,averageViewDuration');
  url.searchParams.set('dimensions', 'day');
  url.searchParams.set('filters', `video==${videoId}`);
  url.searchParams.set('startDate', startDate);
  url.searchParams.set('endDate', endDate);
  return url.toString();
}

export const POST = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const authResult = await authenticateUserOrService(request, { ownerOnly: true });
    if (authResult.response) return authResult.response;
    const { userId } = authResult;

    const body = await request.json();
    const data = AnalyticsSchema.parse(body);

    const videoResult = await query(
      `SELECT v.id, v.youtube_video_id, v.channel_id, c.youtube_channel_id
       FROM videos v
       JOIN channels c ON c.id = v.channel_id
       WHERE v.id = $1 AND c.user_id = $2
       LIMIT 1`,
      [data.videoId, userId]
    );

    if (videoResult.rows.length === 0) {
      return withSecurityHeaders(NextResponse.json({ error: 'Video no encontrado' }, { status: 404 }));
    }

    const videoRow = videoResult.rows[0];
    if (!videoRow.youtube_video_id) {
      return withSecurityHeaders(NextResponse.json({ error: 'Video sin ID de YouTube' }, { status: 400 }));
    }

    const integration = await getIntegrationForUserChannel(userId, videoRow.youtube_channel_id as string);

    if (!integration) {
      return withSecurityHeaders(NextResponse.json({ error: 'YouTube no conectado' }, { status: 404 }));
    }

    const accessToken = await getValidAccessToken(integration);

    const response = await fetch(
      buildAnalyticsUrl(videoRow.youtube_video_id as string, data.startDate, data.endDate),
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[youtube.analytics] Error', { status: response.status, error: errorText });
      return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener analytics' }, { status: 502 }));
    }

    const payload = await response.json();
    return withSecurityHeaders(NextResponse.json({
      rows: Array.isArray(payload?.rows) ? payload.rows : [],
      columnHeaders: payload?.columnHeaders ?? [],
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 }));
    }
    logger.error('[youtube.analytics] Error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener analytics' }, { status: 500 }));
  }
});
