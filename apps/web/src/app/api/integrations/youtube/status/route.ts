import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function redactChannelId(value: string | null): string | null {
  if (!value) return null;
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function envConfigured() {
  return {
    clientId: Boolean(process.env.YOUTUBE_OAUTH_CLIENT_ID),
    clientSecret: Boolean(process.env.YOUTUBE_OAUTH_CLIENT_SECRET),
    redirectUri: Boolean(process.env.YOUTUBE_OAUTH_REDIRECT_URI),
    encryptionKey: Boolean(process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY),
  };
}

export const GET = withAuth(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = getAuthUser(request)?.userId ?? null;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const env = envConfigured();
    const envOk = Object.values(env).every(Boolean);
    if (!envOk) {
      return withSecurityHeaders(NextResponse.json({
        connected: false,
        reason: 'missing_config',
        channelId: null,
        channelTitle: null,
        scopes: null,
        tokenExpiryAt: null,
      }));
    }

    const result = await query(
      `SELECT youtube_channel_id, youtube_channel_title, token_expiry_at, scope
       FROM youtube_integrations
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return withSecurityHeaders(NextResponse.json({
        connected: false,
        reason: 'not_connected',
        channelId: null,
        channelTitle: null,
        scopes: null,
        tokenExpiryAt: null,
      }));
    }

    const row = result.rows[0];
    return withSecurityHeaders(NextResponse.json({
      connected: true,
      channelId: redactChannelId(row.youtube_channel_id),
      channelTitle: row.youtube_channel_title,
      scopes: row.scope,
      tokenExpiryAt: row.token_expiry_at ? new Date(row.token_expiry_at).toISOString() : null,
    }));
  } catch (error) {
    logger.error('[youtube.status] Error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al consultar YouTube' }, { status: 500 }));
  }
}));
