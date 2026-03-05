import { query } from '@/lib/db';
import { openSecret } from '@/lib/crypto/secretBox';
import { refreshAccessToken } from '@/lib/youtube/client';

export interface YouTubeIntegrationRow {
  id: string;
  access_token_enc: string;
  refresh_token_enc: string | null;
  token_expiry_at: string | null;
  scope?: string | null;
}

export async function getIntegrationForUserChannel(userId: string, youtubeChannelId: string) {
  const result = await query(
    `SELECT id, access_token_enc, refresh_token_enc, token_expiry_at, scope
     FROM youtube_integrations
     WHERE user_id = $1 AND youtube_channel_id = $2
     ORDER BY updated_at DESC
     LIMIT 1`,
    [userId, youtubeChannelId]
  );

  return (result.rows[0] as YouTubeIntegrationRow | undefined) ?? null;
}

export async function getLatestIntegrationForUser(userId: string) {
  const result = await query(
    `SELECT id, access_token_enc, refresh_token_enc, token_expiry_at, scope
     FROM youtube_integrations
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT 1`,
    [userId]
  );

  return (result.rows[0] as YouTubeIntegrationRow | undefined) ?? null;
}

export async function getValidAccessToken(integration: YouTubeIntegrationRow) {
  let accessToken = openSecret(integration.access_token_enc);
  const expiry = integration.token_expiry_at ? new Date(integration.token_expiry_at) : null;

  if (!expiry || expiry.getTime() > Date.now() + 60 * 1000) {
    return accessToken;
  }

  if (!integration.refresh_token_enc) {
    throw new Error('Refresh token faltante');
  }

  const refreshed = await refreshAccessToken(integration.refresh_token_enc);
  accessToken = openSecret(refreshed.accessTokenEnc);
  const nextExpiry = refreshed.expiresIn ? new Date(Date.now() + refreshed.expiresIn * 1000) : null;

  await query(
    `UPDATE youtube_integrations
     SET access_token_enc = $1, token_expiry_at = $2, scope = COALESCE($3, scope), updated_at = NOW()
     WHERE id = $4`,
    [refreshed.accessTokenEnc, nextExpiry?.toISOString() ?? null, refreshed.scope ?? null, integration.id]
  );

  return accessToken;
}
