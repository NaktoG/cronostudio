import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { exchangeCodeForTokens } from '@/lib/youtube/oauth';
import { fetchOwnChannel } from '@/lib/youtube/client';
import { sealSecret } from '@/lib/crypto/secretBox';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'yt_oauth_state';
const VERIFIER_COOKIE = 'yt_oauth_verifier';

export const GET = withAuth(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = getAuthUser(request)?.userId ?? null;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return withSecurityHeaders(NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 }));
    }

    const cookieState = request.cookies.get(STATE_COOKIE)?.value || '';
    const verifier = request.cookies.get(VERIFIER_COOKIE)?.value || '';

    if (!cookieState || cookieState !== state || !verifier) {
      return withSecurityHeaders(NextResponse.json({ error: 'Estado OAuth inválido' }, { status: 400 }));
    }

    const tokenData = await exchangeCodeForTokens(code, verifier);
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const scope = tokenData.scope;
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    const channel = await fetchOwnChannel(accessToken);
    const accessEnc = sealSecret(accessToken);
    const refreshEnc = refreshToken ? sealSecret(refreshToken) : null;

    const channelMatch = await query(
      `SELECT id FROM channels WHERE user_id = $1 AND youtube_channel_id = $2 LIMIT 1`,
      [userId, channel.id]
    );
    const channelId = channelMatch.rows[0]?.id ?? null;

    const existingIntegration = await query(
      `SELECT refresh_token_enc FROM youtube_integrations WHERE youtube_channel_id = $1 LIMIT 1`,
      [channel.id]
    );
    const existingRefreshEnc = existingIntegration.rows[0]?.refresh_token_enc ?? null;

    if (!refreshToken && !existingRefreshEnc) {
      return withSecurityHeaders(NextResponse.json({
        error: 'No se recibió refresh_token. Reintenta conectando con consentimiento.',
      }, { status: 400 }));
    }

    await query(
      `INSERT INTO youtube_integrations (
          user_id,
          channel_id,
          youtube_channel_id,
          youtube_channel_title,
          access_token_enc,
          refresh_token_enc,
          token_expiry_at,
          scope
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (youtube_channel_id)
        DO UPDATE SET
          user_id = EXCLUDED.user_id,
          channel_id = EXCLUDED.channel_id,
          youtube_channel_title = EXCLUDED.youtube_channel_title,
          access_token_enc = EXCLUDED.access_token_enc,
          refresh_token_enc = COALESCE(EXCLUDED.refresh_token_enc, youtube_integrations.refresh_token_enc),
          token_expiry_at = EXCLUDED.token_expiry_at,
          scope = EXCLUDED.scope,
          updated_at = NOW()`,
      [
        userId,
        channelId,
        channel.id,
        channel.title ?? null,
        accessEnc,
        refreshEnc,
        expiresAt,
        scope ?? null,
      ]
    );

    const redirectUrl = new URL('/?youtube=connected', request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(STATE_COOKIE, '', { path: '/', maxAge: 0 });
    response.cookies.set(VERIFIER_COOKIE, '', { path: '/', maxAge: 0 });
    return withSecurityHeaders(response);
  } catch (error) {
    logger.error('[youtube.callback] Error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al conectar YouTube' }, { status: 500 }));
  }
}));
