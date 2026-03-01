import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  endOfIsoWeekInTimeZone,
  getIsoWeekInfoInTimeZone,
  getWeekdayDateInTimeZone,
  getWeekdayNameInTimeZone,
  setTimeOnDateUtc,
  startOfIsoWeekInTimeZone,
} from '@/lib/dates';

export const dynamic = 'force-dynamic';

const WEEK_TARGET = 2;
const WEEKS_BACK = 12;
const TIME_ZONE = 'Europe/Madrid';

function buildWeekKey(isoYear: number, isoWeek: number) {
  return `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
}

async function resolveChannel(userId: string, channelId?: string | null) {
  if (channelId) {
    const result = await query(
      `SELECT id, name FROM channels WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [channelId, userId]
    );
    if (result.rows.length === 0) return null;
    return { id: result.rows[0].id as string, name: result.rows[0].name as string, source: 'explicit' as const };
  }

  const result = await query(
    `SELECT id, name FROM channels WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
    [userId]
  );
  if (result.rows.length === 0) return null;
  return { id: result.rows[0].id as string, name: result.rows[0].name as string, source: 'default' as const };
}

function computeStreak(weekStarts: Date[], counts: Map<string, number>, timeZone: string) {
  let current = 0;
  for (let i = weekStarts.length - 1; i >= 0; i -= 1) {
    const isoInfo = getIsoWeekInfoInTimeZone(weekStarts[i], timeZone);
    const weekKey = buildWeekKey(isoInfo.isoYear, isoInfo.isoWeek);
    if ((counts.get(weekKey) ?? 0) >= WEEK_TARGET) {
      current += 1;
    } else {
      break;
    }
  }

  let best = 0;
  let run = 0;
  for (const weekStart of weekStarts) {
    const isoInfo = getIsoWeekInfoInTimeZone(weekStart, timeZone);
    const weekKey = buildWeekKey(isoInfo.isoYear, isoInfo.isoWeek);
    if ((counts.get(weekKey) ?? 0) >= WEEK_TARGET) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }

  return { current, best };
}

export const GET = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = getAuthUser(request)?.userId ?? null;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const { searchParams } = new URL(request.url);
    const channelIdParam = searchParams.get('channelId');

    const channel = await resolveChannel(userId, channelIdParam);
    if (!channel) {
      return withSecurityHeaders(NextResponse.json({ error: 'Canal requerido' }, { status: 400 }));
    }

    const now = new Date();
    const weekStart = startOfIsoWeekInTimeZone(now, TIME_ZONE);
    const weekEnd = endOfIsoWeekInTimeZone(now, TIME_ZONE);
    const isoInfo = getIsoWeekInfoInTimeZone(weekStart, TIME_ZONE);
    const weekKey = buildWeekKey(isoInfo.isoYear, isoInfo.isoWeek);

    const publishedResult = await query(
      `SELECT published_at FROM publish_events
       WHERE user_id = $1 AND channel_id = $2 AND published_at BETWEEN $3 AND $4`,
      [userId, channel.id, weekStart.toISOString(), weekEnd.toISOString()]
    );
    const publishedCount = publishedResult.rows.length;

    const slots = [
      { day: 'tuesday' as const, done: false, publishedAt: null as string | null },
      { day: 'friday' as const, done: false, publishedAt: null as string | null },
    ];
    for (const row of publishedResult.rows) {
      const publishedAt = new Date(row.published_at as string);
      const weekday = getWeekdayNameInTimeZone(publishedAt, TIME_ZONE);
      const slot = slots.find((item) => item.day === weekday);
      if (slot && !slot.done) {
        slot.done = true;
        slot.publishedAt = publishedAt.toISOString();
      }
    }

    const wednesday = getWeekdayDateInTimeZone(weekStart, 'wednesday');
    const friday = getWeekdayDateInTimeZone(weekStart, 'friday');
    const fridayMidday = friday ? setTimeOnDateUtc(friday, '12:00') : null;

    let status: 'OK' | 'EN_RIESGO' | 'FALLIDA' | 'CUMPLIDA' = 'OK';
    if (publishedCount >= WEEK_TARGET) {
      status = 'CUMPLIDA';
    } else if (now.getTime() > weekEnd.getTime()) {
      status = 'FALLIDA';
    } else if (publishedCount === 0) {
      if (wednesday && now.getTime() >= wednesday.getTime()) {
        status = 'EN_RIESGO';
      }
      if (fridayMidday && now.getTime() >= fridayMidday.getTime()) {
        status = 'EN_RIESGO';
      }
    }

    const weekStarts: Date[] = [];
    for (let i = WEEKS_BACK - 1; i >= 0; i -= 1) {
      const date = new Date(weekStart.getTime());
      date.setUTCDate(weekStart.getUTCDate() - i * 7);
      weekStarts.push(date);
    }
    const oldest = weekStarts[0];

    const historyResult = await query(
      `SELECT published_at FROM publish_events
       WHERE user_id = $1 AND channel_id = $2 AND published_at >= $3`,
      [userId, channel.id, oldest.toISOString()]
    );

    const counts = new Map<string, number>();
    for (const row of historyResult.rows) {
      const publishedAt = new Date(row.published_at as string);
      const info = getIsoWeekInfoInTimeZone(publishedAt, TIME_ZONE);
      const key = buildWeekKey(info.isoYear, info.isoWeek);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const streak = computeStreak(weekStarts, counts, TIME_ZONE);

    const tuesday = getWeekdayDateInTimeZone(weekStart, 'tuesday');

    return withSecurityHeaders(NextResponse.json({
      channel: { id: channel.id, name: channel.name, source: channel.source },
      week: {
        isoYear: isoInfo.isoYear,
        isoWeek: isoInfo.isoWeek,
        weekKey,
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
      },
      scoreboard: {
        count: publishedCount,
        target: WEEK_TARGET,
      },
      slots,
      deadlines: {
        tuesday: tuesday ? setTimeOnDateUtc(tuesday, '12:00').toISOString() : null,
        friday: fridayMidday ? fridayMidday.toISOString() : null,
      },
      status,
      streak,
    }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[discipline.weekly] Error', { message: errorMessage });
    const payload: Record<string, unknown> = { error: 'Error al obtener disciplina semanal' };
    if (process.env.NODE_ENV !== 'production') {
      payload['detail'] = errorMessage;
    }
    return withSecurityHeaders(NextResponse.json(payload, { status: 500 }));
  }
});
