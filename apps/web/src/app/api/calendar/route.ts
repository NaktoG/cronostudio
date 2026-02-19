import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { logger } from '@/lib/logger';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const CalendarQuerySchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

const parseDate = (value: string): Date | null => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const GET = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = getAuthUser(request)?.userId ?? null;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const { searchParams } = new URL(request.url);
    const parsed = CalendarQuerySchema.safeParse({
      from: searchParams.get('from') ?? '',
      to: searchParams.get('to') ?? '',
    });

    if (!parsed.success) {
      return withSecurityHeaders(NextResponse.json({ error: 'Rango inválido' }, { status: 400 }));
    }

    const fromDate = parseDate(parsed.data.from);
    const toDate = parseDate(parsed.data.to);
    if (!fromDate || !toDate) {
      return withSecurityHeaders(NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 }));
    }
    if (fromDate > toDate) {
      return withSecurityHeaders(NextResponse.json({ error: 'Rango inválido' }, { status: 400 }));
    }

    const sql = `
      SELECT id, title, status, COALESCE(scheduled_publish_at, target_date::timestamp) as scheduled_at
      FROM productions
      WHERE user_id = $1
        AND COALESCE(scheduled_publish_at, target_date::timestamp) IS NOT NULL
        AND COALESCE(scheduled_publish_at, target_date::timestamp) >= $2
        AND COALESCE(scheduled_publish_at, target_date::timestamp) <= $3
      ORDER BY scheduled_at ASC
    `;

    const result = await query(sql, [userId, fromDate.toISOString(), toDate.toISOString()]);

    const items = result.rows.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      type: 'production' as const,
      scheduledAt: new Date(row.scheduled_at as string).toISOString(),
      status: row.status as string,
      route: `/productions/${row.id as string}`,
    }));

    return withSecurityHeaders(NextResponse.json({ items }));
  } catch (error) {
    logger.error('Error fetching calendar', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener calendario' }, { status: 500 }));
  }
});
