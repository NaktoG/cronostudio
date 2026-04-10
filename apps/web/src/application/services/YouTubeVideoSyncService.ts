import { query } from '@/lib/db';
import { fetchUploadsPlaylistByChannelId, fetchPlaylistItems } from '@/lib/youtube/client';
import { getValidAccessToken } from '@/application/services/YouTubeIntegrationService';

type SyncVideosResult = {
  channelId: string;
  youtubeChannelId: string;
  created: number;
  skipped: number;
};

export async function syncYouTubeVideosForUser(userId: string, options?: { channelId?: string; limit?: number }): Promise<SyncVideosResult[]> {
  const limit = options?.limit ?? 20;

  const channels = await query(
    options?.channelId
      ? `SELECT id, youtube_channel_id FROM channels WHERE id = $1 AND user_id = $2`
      : `SELECT id, youtube_channel_id FROM channels WHERE user_id = $1 AND youtube_channel_id IS NOT NULL`,
    options?.channelId ? [options.channelId, userId] : [userId]
  );

  if (channels.rows.length === 0) {
    return [];
  }

  const results: SyncVideosResult[] = [];

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

    const accessToken = await getValidAccessToken({
      id: integration.rows[0].id as string,
      user_id: userId,
      access_token_enc: integration.rows[0].access_token_enc as string,
      refresh_token_enc: (integration.rows[0].refresh_token_enc as string | null) ?? null,
      token_expiry_at: (integration.rows[0].token_expiry_at as string | null) ?? null,
    });
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

  return results;
}
