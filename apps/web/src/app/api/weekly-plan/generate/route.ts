import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRoles } from '@/middleware/rbac';
import { getClient } from '@/lib/db';
import { getDateFromIsoWeek, getIsoWeekInfo } from '@/lib/dates';

export const dynamic = 'force-dynamic';

function buildWeekKey(isoYear: number, isoWeek: number) {
  return `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
}

export const POST = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  const userId = (await getAuthUser(request))?.userId ?? null;
  if (!userId) {
    return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
  }

  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get('channelId');
  const isoYearParam = searchParams.get('isoYear');
  const isoWeekParam = searchParams.get('isoWeek');

  if (!channelId) {
    return withSecurityHeaders(NextResponse.json({ error: 'channelId requerido' }, { status: 400 }));
  }

  const now = new Date();
  const isoInfo = getIsoWeekInfo(now);
  const isoYear = isoYearParam ? Number(isoYearParam) : isoInfo.isoYear;
  const isoWeek = isoWeekParam ? Number(isoWeekParam) : isoInfo.isoWeek;
  if (!Number.isInteger(isoYear) || isoYear < 2000 || isoYear > 2100) {
    return withSecurityHeaders(NextResponse.json({ error: 'isoYear inválido' }, { status: 400 }));
  }
  if (!Number.isInteger(isoWeek) || isoWeek < 1 || isoWeek > 53) {
    return withSecurityHeaders(NextResponse.json({ error: 'isoWeek inválido' }, { status: 400 }));
  }

  const weekKey = buildWeekKey(isoYear, isoWeek);
  const weekStart = getDateFromIsoWeek(isoYear, isoWeek);

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const ownedChannel = await client.query(
      `SELECT id
       FROM channels
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [channelId, userId]
    );

    if (ownedChannel.rowCount === 0) {
      await client.query('ROLLBACK');
      return withSecurityHeaders(NextResponse.json({ error: 'Canal no encontrado o no autorizado' }, { status: 404 }));
    }

    const existing = await client.query(
      `SELECT id, title, planned_publish_day, status
       FROM productions
       WHERE user_id = $1 AND channel_id = $2 AND iso_year = $3 AND iso_week = $4
       ORDER BY planned_publish_day ASC`,
      [userId, channelId, isoYear, isoWeek]
    );

    const plannedDays = new Set(existing.rows.map((row) => row.planned_publish_day));
    const toCreate: { title: string; planned_publish_day: string }[] = [];
    if (!plannedDays.has('tuesday')) {
      toCreate.push({ title: 'Video A', planned_publish_day: 'tuesday' });
    }
    if (!plannedDays.has('friday')) {
      toCreate.push({ title: 'Video B', planned_publish_day: 'friday' });
    }

    for (const item of toCreate) {
      await client.query(
        `INSERT INTO productions (user_id, channel_id, title, status, planned_publish_day, iso_year, iso_week, week_key)
         VALUES ($1, $2, $3, 'idea', $4, $5, $6, $7)`,
        [userId, channelId, item.title, item.planned_publish_day, isoYear, isoWeek, weekKey]
      );
    }

    const result = await client.query(
      `SELECT id, title, planned_publish_day, status
       FROM productions
       WHERE user_id = $1 AND channel_id = $2 AND iso_year = $3 AND iso_week = $4
       ORDER BY planned_publish_day ASC`,
      [userId, channelId, isoYear, isoWeek]
    );

    await client.query('COMMIT');

    return withSecurityHeaders(NextResponse.json({
      isoYear,
      isoWeek,
      weekKey,
      weekStart: weekStart.toISOString(),
      planGenerated: result.rows.length >= 2,
      plannedProductions: result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        day: row.planned_publish_day,
        status: row.status,
      })),
    }));
  } catch {
    await client.query('ROLLBACK');
    return withSecurityHeaders(NextResponse.json({ error: 'Error al generar plan semanal' }, { status: 500 }));
  } finally {
    client.release();
  }
}));
