import { query } from '@/lib/db';
import { fetchChannelDetails } from '@/lib/youtube/client';
import { getValidAccessToken } from '@/application/services/YouTubeIntegrationService';

type SyncChannelResult = {
  youtubeChannelId: string;
  channelId: string;
  status: 'created' | 'updated';
};

export async function syncYouTubeChannelsForUser(userId: string, youtubeChannelId?: string): Promise<SyncChannelResult[]> {
  const integrations = await query(
    youtubeChannelId
      ? `SELECT id, youtube_channel_id, access_token_enc, refresh_token_enc, token_expiry_at
         FROM youtube_integrations
         WHERE user_id = $1 AND youtube_channel_id = $2
         ORDER BY updated_at DESC
         LIMIT 1`
      : `SELECT id, youtube_channel_id, access_token_enc, refresh_token_enc, token_expiry_at
         FROM youtube_integrations
         WHERE user_id = $1
         ORDER BY updated_at DESC`,
    youtubeChannelId ? [userId, youtubeChannelId] : [userId]
  );

  if (integrations.rows.length === 0) {
    return [];
  }

  const results: SyncChannelResult[] = [];

  for (const row of integrations.rows) {
    const accessToken = await getValidAccessToken({
      id: row.id as string,
      user_id: userId,
      access_token_enc: row.access_token_enc as string,
      refresh_token_enc: (row.refresh_token_enc as string | null) ?? null,
      token_expiry_at: (row.token_expiry_at as string | null) ?? null,
    });
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

  return results;
}
