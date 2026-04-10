import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getIntegrationForUserChannel, getValidAccessToken } from '@/application/services/YouTubeIntegrationService';

type IngestResult = {
  processedVideos: number;
  upsertedRows: number;
  skippedVideos: number;
};

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildAnalyticsUrl(youtubeVideoId: string, day: string) {
  const url = new URL('https://youtubeanalytics.googleapis.com/v2/reports');
  url.searchParams.set('ids', 'channel==MINE');
  url.searchParams.set('metrics', 'views,estimatedMinutesWatched,averageViewDuration');
  url.searchParams.set('dimensions', 'day');
  url.searchParams.set('filters', `video==${youtubeVideoId}`);
  url.searchParams.set('startDate', day);
  url.searchParams.set('endDate', day);
  return url.toString();
}

export async function ingestYouTubeDailyAnalyticsForUser(userId: string, dayInput?: string): Promise<IngestResult> {
  const targetDate = dayInput ? new Date(`${dayInput}T00:00:00.000Z`) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const day = formatDay(targetDate);

  const videos = await query(
    `SELECT v.id AS video_id, v.youtube_video_id, c.youtube_channel_id
     FROM videos v
     JOIN channels c ON c.id = v.channel_id
     WHERE c.user_id = $1
       AND v.youtube_video_id IS NOT NULL
       AND c.youtube_channel_id IS NOT NULL`,
    [userId]
  );

  if (videos.rows.length === 0) {
    return { processedVideos: 0, upsertedRows: 0, skippedVideos: 0 };
  }

  let processedVideos = 0;
  let upsertedRows = 0;
  let skippedVideos = 0;
  let transientFailures = 0;
  const integrationCache = new Map<string, Awaited<ReturnType<typeof getIntegrationForUserChannel>> | null>();

  for (const row of videos.rows) {
    const youtubeChannelId = row.youtube_channel_id as string;
    if (!integrationCache.has(youtubeChannelId)) {
      integrationCache.set(youtubeChannelId, await getIntegrationForUserChannel(userId, youtubeChannelId));
    }

    const integration = integrationCache.get(youtubeChannelId) ?? null;
    if (!integration) {
      skippedVideos += 1;
      continue;
    }

    const accessToken = await getValidAccessToken(integration);
    const response = await fetch(buildAnalyticsUrl(row.youtube_video_id as string, day), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      if (response.status === 429 || response.status >= 500) {
        transientFailures += 1;
      } else {
        skippedVideos += 1;
      }
      logger.warn('[youtube.analytics.ingest] upstream error', {
        status: response.status,
        videoId: row.video_id,
        youtubeVideoId: row.youtube_video_id,
      });
      continue;
    }

    const payload = await response.json();
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    if (rows.length === 0) {
      processedVideos += 1;
      continue;
    }

    for (const metricRow of rows) {
      const metricDate = String(metricRow?.[0] ?? day);
      const views = Number(metricRow?.[1] ?? 0);
      const watchTimeMinutes = Number(metricRow?.[2] ?? 0);
      const avgViewDurationSeconds = Number(metricRow?.[3] ?? 0);

      await query(
        `INSERT INTO analytics (video_id, date, views, watch_time_minutes, avg_view_duration_seconds)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (video_id, date)
         DO UPDATE SET
            views = EXCLUDED.views,
            watch_time_minutes = EXCLUDED.watch_time_minutes,
            avg_view_duration_seconds = EXCLUDED.avg_view_duration_seconds`,
        [row.video_id, metricDate, views, watchTimeMinutes, avgViewDurationSeconds]
      );
      upsertedRows += 1;
    }

    processedVideos += 1;
  }

  if (transientFailures > 0) {
    throw new Error(`transient upstream failures detected: ${transientFailures}`);
  }

  return { processedVideos, upsertedRows, skippedVideos };
}
