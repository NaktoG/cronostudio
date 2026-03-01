import { openSecret, sealSecret } from '@/lib/crypto/secretBox';
import { getOAuthConfig } from '@/lib/youtube/oauth';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export async function fetchOwnChannel(accessToken: string) {
  const url = new URL(`${YOUTUBE_API_BASE}/channels`);
  url.searchParams.set('part', 'id,snippet');
  url.searchParams.set('mine', 'true');

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch YouTube channel.');
  }

  const data = await response.json();
  const channel = data.items?.[0];
  if (!channel) {
    throw new Error('No YouTube channel found for account.');
  }

  return {
    id: channel.id as string,
    title: channel.snippet?.title as string | undefined,
  };
}

export async function refreshAccessToken(refreshTokenEnc: string) {
  const refreshToken = openSecret(refreshTokenEnc);
  const config = getOAuthConfig();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh YouTube token.');
  }

  const data = await response.json();
  return {
    accessTokenEnc: sealSecret(data.access_token as string),
    expiresIn: data.expires_in as number | undefined,
    scope: data.scope as string | undefined,
  };
}
