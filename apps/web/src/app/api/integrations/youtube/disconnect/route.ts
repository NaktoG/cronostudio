import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const handler = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
  const userId = (await getAuthUser(request))?.userId ?? null;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    await query('DELETE FROM youtube_integrations WHERE user_id = $1', [userId]);
    return withSecurityHeaders(NextResponse.json({ disconnected: true }));
  } catch (error) {
    logger.error('[youtube.disconnect] Error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al desconectar YouTube' }, { status: 500 }));
  }
});

export const POST = withAuth(handler);
