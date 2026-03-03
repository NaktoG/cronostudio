import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { exchangeCodeForTokens } from '@/lib/youtube/oauth';
import { fetchOwnChannel } from '@/lib/youtube/client';
import { sealSecret } from '@/lib/crypto/secretBox';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'yt_oauth_state';
const VERIFIER_COOKIE = 'yt_oauth_verifier';
const USER_COOKIE = 'yt_oauth_user';

export const GET = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const requestId = request.headers.get('x-request-id') || null;
    const userId = request.cookies.get(USER_COOKIE)?.value ?? null;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const scopeParam = searchParams.get('scope');
    const errorParam = searchParams.get('error');

    const debug = {
      requestId,
      cookiePresence: {
        state: false,
        pkce: false,
        user: Boolean(userId),
      },
      queryPresence: {
        code: Boolean(code),
        state: Boolean(state),
        scope: Boolean(scopeParam),
        error: Boolean(errorParam),
      },
      tokenExchange: {} as Record<string, unknown>,
      youtubeApi: {} as Record<string, unknown>,
      errorName: '' as string | undefined,
      errorMessage: '' as string | undefined,
      errorCode: '' as string | undefined,
    };

    if (!code || !state) {
      const payload: Record<string, unknown> = { error: 'youtube_oauth_failed' };
      if (process.env.NODE_ENV !== 'production') {
        payload.details = debug;
      }
      return withSecurityHeaders(NextResponse.json(payload, { status: 400 }));
    }

    const cookieState = request.cookies.get(STATE_COOKIE)?.value || '';
    const verifier = request.cookies.get(VERIFIER_COOKIE)?.value || '';
    debug.cookiePresence = {
      state: Boolean(cookieState),
      pkce: Boolean(verifier),
      user: Boolean(userId),
    };
    if (!debug.cookiePresence.state || !debug.cookiePresence.pkce || !debug.cookiePresence.user) {
      logger.warn('[youtube.callback] Missing OAuth cookies', { debug });
    }

    if (!cookieState || cookieState !== state || !verifier || !userId) {
      const payload: Record<string, unknown> = { error: 'youtube_oauth_failed' };
      if (process.env.NODE_ENV !== 'production') {
        payload.details = debug;
      }
      return withSecurityHeaders(NextResponse.json(payload, { status: 400 }));
    }

    if (errorParam) {
      debug.tokenExchange = { error: errorParam };
      const payload: Record<string, unknown> = { error: 'youtube_oauth_failed' };
      if (process.env.NODE_ENV !== 'production') {
        payload.details = debug;
      }
      return withSecurityHeaders(NextResponse.json(payload, { status: 400 }));
    }

    let tokenData;
    try {
      tokenData = await exchangeCodeForTokens(code, verifier);
      debug.tokenExchange = { ok: true };
    } catch (error) {
      const err = error as { status?: number; oauth?: { error?: string; error_description?: string }; code?: string };
      debug.tokenExchange = {
        ok: false,
        status: err.status,
        error: err.oauth?.error,
        error_description: err.oauth?.error_description,
      };
      debug.errorName = error instanceof Error ? error.name : 'Error';
      debug.errorMessage = error instanceof Error ? error.message : String(error);
      debug.errorCode = err.code;
      if (process.env.NODE_ENV !== 'production') {
        return withSecurityHeaders(NextResponse.json({ error: 'youtube_oauth_failed', details: debug }, { status: 502 }));
      }
      logger.error('[youtube.callback] Error', { debug });
      return withSecurityHeaders(NextResponse.json({ error: 'Error al conectar YouTube' }, { status: 500 }));
    }
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const scope = tokenData.scope;
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    let channel;
    try {
      channel = await fetchOwnChannel(accessToken);
    } catch (error) {
      const err = error as { status?: number; message?: string };
      debug.youtubeApi = {
        step: 'channels.list',
        status: err.status,
        error: err.message,
      };
      debug.errorName = error instanceof Error ? error.name : 'Error';
      debug.errorMessage = error instanceof Error ? error.message : String(error);
      if (process.env.NODE_ENV !== 'production') {
        return withSecurityHeaders(NextResponse.json({ error: 'youtube_oauth_failed', details: debug }, { status: 502 }));
      }
      logger.error('[youtube.callback] Error', { debug });
      return withSecurityHeaders(NextResponse.json({ error: 'Error al conectar YouTube' }, { status: 500 }));
    }
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
    response.cookies.set(USER_COOKIE, '', { path: '/', maxAge: 0 });
    return withSecurityHeaders(response);
  } catch (error) {
    const debug = {
      requestId: request.headers.get('x-request-id') || null,
      errorName: error instanceof Error ? error.name : 'Error',
      errorMessage: error instanceof Error ? error.message : String(error),
    };
    if (process.env.NODE_ENV !== 'production') {
      return withSecurityHeaders(NextResponse.json({ error: 'youtube_oauth_failed', details: debug }, { status: 502 }));
    }
    logger.error('[youtube.callback] Error', { debug });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al conectar YouTube' }, { status: 500 }));
  }
});
