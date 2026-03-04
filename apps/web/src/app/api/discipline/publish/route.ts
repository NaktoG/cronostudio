import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRoles } from '@/middleware/rbac';
import { getClient } from '@/lib/db';
import {
  getIsoWeekInfoInTimeZone,
  getWeekdayDateInTimeZone,
  getWeekdayNameInTimeZone,
  setTimeOnDateUtc,
  startOfIsoWeekInTimeZone,
} from '@/lib/dates';

export const dynamic = 'force-dynamic';

const PublishQuickSchema = z.object({
  channelId: z.string().uuid(),
  targetDay: z.enum(['tuesday', 'friday']),
  publishedAt: z.string().datetime().optional(),
  platform: z.string().optional(),
  platformId: z.string().optional(),
  publishedUrl: z.string().url().optional().nullable(),
});

function buildWeekKey(isoYear: number, isoWeek: number) {
  return `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
}

function buildTitle(day: 'tuesday' | 'friday', date: Date) {
  const label = day === 'tuesday' ? 'Martes' : 'Viernes';
  const stamp = date.toISOString().slice(0, 10);
  return `Publicacion rapida ${label} ${stamp}`;
}

const TIME_ZONE = 'Europe/Madrid';

export const POST = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  const userId = (await getAuthUser(request))?.userId ?? null;
  if (!userId) {
    return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
  }

  const body = await request.json();
  const data = PublishQuickSchema.parse(body);

  const client = await getClient();
  try {
    const channelResult = await client.query(
      `SELECT id FROM channels WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [data.channelId, userId]
    );
    if (channelResult.rows.length === 0) {
      return withSecurityHeaders(NextResponse.json({ error: 'Canal no encontrado' }, { status: 404 }));
    }

    const now = new Date();
    const weekStart = startOfIsoWeekInTimeZone(now, TIME_ZONE);
    const baseDate = data.publishedAt
      ? new Date(data.publishedAt)
      : (() => {
          const targetDate = getWeekdayDateInTimeZone(weekStart, data.targetDay);
          if (!targetDate) return now;
          return setTimeOnDateUtc(targetDate, '12:00');
        })();

    const isoInfo = getIsoWeekInfoInTimeZone(baseDate, TIME_ZONE);
    const weekKey = buildWeekKey(isoInfo.isoYear, isoInfo.isoWeek);
    const title = buildTitle(data.targetDay, baseDate);

    const weekEnd = new Date(weekStart.getTime());
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const existingEvents = await client.query(
      `SELECT id, published_at FROM publish_events
       WHERE user_id = $1 AND channel_id = $2 AND published_at BETWEEN $3 AND $4
       ORDER BY published_at ASC`,
      [userId, data.channelId, weekStart.toISOString(), weekEnd.toISOString()]
    );

    const duplicate = existingEvents.rows.find((row) => {
      const weekday = getWeekdayNameInTimeZone(new Date(row.published_at as string), TIME_ZONE);
      return weekday === data.targetDay;
    });
    if (duplicate) {
      return withSecurityHeaders(NextResponse.json({
        eventId: duplicate.id,
        publishedAt: new Date(duplicate.published_at as string).toISOString(),
        targetDay: data.targetDay,
        weekKey,
        alreadyRegistered: true,
      }));
    }

    await client.query('BEGIN');

    const productionResult = await client.query(
      `INSERT INTO productions (user_id, channel_id, title, status, planned_publish_day, iso_year, iso_week, week_key, published_at)
       VALUES ($1, $2, $3, 'published', $4, $5, $6, $7, $8)
       RETURNING id`,
      [userId, data.channelId, title, data.targetDay, isoInfo.isoYear, isoInfo.isoWeek, weekKey, baseDate]
    );

    const productionId = productionResult.rows[0].id as string;

    await client.query(
      `INSERT INTO publish_events (production_id, user_id, channel_id, platform, platform_id, published_url, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        productionId,
        userId,
        data.channelId,
        data.platform ?? 'youtube',
        data.platformId ?? null,
        data.publishedUrl ?? null,
        baseDate,
      ]
    );

    await client.query('COMMIT');

    return withSecurityHeaders(NextResponse.json({
      productionId,
      publishedAt: baseDate.toISOString(),
      targetDay: data.targetDay,
      weekKey,
      alreadyRegistered: false,
    }));
  } catch (error) {
    await client.query('ROLLBACK');
    const errorMessage = error instanceof Error ? error.message : String(error);
    const payload: Record<string, unknown> = { error: 'Error al registrar publicacion' };
    if (process.env.NODE_ENV !== 'production') {
      payload['detail'] = errorMessage;
    }
    return withSecurityHeaders(NextResponse.json(payload, { status: 500 }));
  } finally {
    client.release();
  }
}));
