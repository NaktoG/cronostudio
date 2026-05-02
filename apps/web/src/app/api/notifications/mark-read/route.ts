import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

const payloadSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  markAll: z.boolean().optional(),
});

export const POST = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = (await getAuthUser(request))?.userId;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const body = await request.json().catch(() => ({}));
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return withSecurityHeaders(NextResponse.json({ error: 'Datos invalidos' }, { status: 400 }));
    }

    if (parsed.data.markAll) {
      await query(
        `UPDATE app_notifications
         SET read_at = NOW()
         WHERE user_id = $1 AND read_at IS NULL`,
        [userId]
      );
    } else if (parsed.data.ids && parsed.data.ids.length > 0) {
      await query(
        `UPDATE app_notifications
         SET read_at = NOW()
         WHERE user_id = $1 AND id = ANY($2::uuid[])`,
        [userId, parsed.data.ids]
      );
    }

    const unreadResult = await query(
      `SELECT COUNT(*)::int AS unread_count
       FROM app_notifications
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );

    return withSecurityHeaders(NextResponse.json({ unreadCount: unreadResult.rows[0]?.unread_count ?? 0 }));
  } catch (error) {
    logger.error('notifications.markRead.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'No pudimos actualizar notificaciones' }, { status: 500 }));
  }
});
