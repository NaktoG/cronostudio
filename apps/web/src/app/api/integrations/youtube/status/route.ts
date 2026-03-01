import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = withAuth(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = getAuthUser(request)?.userId ?? null;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
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
        channelId: null,
        channelTitle: null,
        scopes: null,
        tokenExpiryAt: null,
      }));
    }

    const row = result.rows[0];
    return withSecurityHeaders(NextResponse.json({
      connected: true,
      channelId: row.youtube_channel_id,
      channelTitle: row.youtube_channel_title,
      scopes: row.scope,
      tokenExpiryAt: row.token_expiry_at ? new Date(row.token_expiry_at).toISOString() : null,
    }));
  } catch (error) {
    logger.error('[youtube.status] Error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al consultar YouTube' }, { status: 500 }));
  }
}));
