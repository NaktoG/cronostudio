import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRoles } from '@/middleware/rbac';
import { query } from '@/lib/db';
import { getIsoWeekInfo } from '@/lib/dates';
import { getInt, getString } from '@/lib/http/query';

export const dynamic = 'force-dynamic';

const WeeklyGoalSchema = z.object({
  channelId: z.string().uuid().optional(),
  isoYear: z.number().int().min(2000).max(2100).optional(),
  isoWeek: z.number().int().min(1).max(53).optional(),
  targetVideos: z.number().int().min(1).max(10).optional(),
  diasPublicacion: z.array(z.string()).min(2).max(7).optional(),
  horaCorte: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

function buildDefaultGoal() {
  return {
    targetVideos: 2,
    diasPublicacion: ['tuesday', 'friday'],
    horaCorte: '12:00',
  };
}

type ChannelResolution = {
  id: string | null;
  name: string | null;
  source: 'explicit' | 'default' | 'missing';
};

async function resolveChannel(userId: string, channelId?: string | null): Promise<ChannelResolution> {
  if (channelId) {
    const result = await query(
      `SELECT id, name FROM channels WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [channelId, userId]
    );
    if (result.rows.length === 0) {
      return { id: null, name: null, source: 'missing' };
    }
    return { id: result.rows[0].id, name: result.rows[0].name, source: 'explicit' };
  }

  const result = await query(
    `SELECT id, name FROM channels WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
    [userId]
  );
  if (result.rows.length === 0) {
    return { id: null, name: null, source: 'missing' };
  }
  return { id: result.rows[0].id, name: result.rows[0].name, source: 'default' };
}

export async function GET(request: NextRequest) {
  try {
    const userId = getAuthUser(request)?.userId ?? null;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const { searchParams } = new URL(request.url);
    const channelIdParam = getString(searchParams, 'channelId');
    const now = new Date();
    const isoInfo = getIsoWeekInfo(now);

    if (channelIdParam) {
      const channelIdCheck = z.string().uuid().safeParse(channelIdParam);
      if (!channelIdCheck.success) {
        return withSecurityHeaders(NextResponse.json({ error: 'invalid_query', field: 'channelId' }, { status: 400 }));
      }
    }

    const isoYear = getInt(searchParams, 'isoYear', { min: 2000, max: 2100, defaultValue: isoInfo.isoYear });
    if (isoYear === null) {
      return withSecurityHeaders(NextResponse.json({ error: 'invalid_query', field: 'isoYear' }, { status: 400 }));
    }
    const isoWeek = getInt(searchParams, 'isoWeek', { min: 1, max: 53, defaultValue: isoInfo.isoWeek });
    if (isoWeek === null) {
      return withSecurityHeaders(NextResponse.json({ error: 'invalid_query', field: 'isoWeek' }, { status: 400 }));
    }

    const channel = await resolveChannel(userId, channelIdParam);
    if (!channel.id) {
      return withSecurityHeaders(NextResponse.json({ error: 'Canal requerido' }, { status: 400 }));
    }

    const channelId = channel.id;

    const result = await query(
      `SELECT target_videos, dias_publicacion, hora_corte
       FROM weekly_goals
       WHERE user_id = $1 AND channel_id = $2 AND iso_year = $3 AND iso_week = $4`,
      [userId, channelId, isoYear, isoWeek]
    );

    if (result.rows.length === 0) {
      return withSecurityHeaders(NextResponse.json({
      goal: buildDefaultGoal(),
      channel: { id: channelId, name: channel.name },
      channelSource: channel.source,
      isoYear,
      isoWeek,
      source: 'default',
    }));
  }

    const row = result.rows[0];
    return withSecurityHeaders(NextResponse.json({
      goal: {
        targetVideos: row.target_videos,
        diasPublicacion: row.dias_publicacion,
        horaCorte: row.hora_corte,
      },
      channel: { id: channelId, name: channel.name },
      channelSource: channel.source,
      isoYear,
      isoWeek,
      source: 'stored',
    }));
  } catch (error) {
    return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener metas semanales' }, { status: 500 }));
  }
}

export const PUT = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = getAuthUser(request)?.userId ?? null;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const body = await request.json();
    const input = WeeklyGoalSchema.parse(body);
    const now = new Date();
    const isoInfo = getIsoWeekInfo(now);

    const channel = await resolveChannel(userId, input.channelId ?? null);
    if (!channel.id) {
      return withSecurityHeaders(NextResponse.json({ error: 'Canal requerido' }, { status: 400 }));
    }
    const channelId = channel.id;

    const goal = buildDefaultGoal();
    const isoYear = input.isoYear ?? isoInfo.isoYear;
    const isoWeek = input.isoWeek ?? isoInfo.isoWeek;

    const targetVideos = input.targetVideos ?? goal.targetVideos;
    const diasPublicacion = input.diasPublicacion ?? goal.diasPublicacion;
    const horaCorte = input.horaCorte ?? goal.horaCorte;

    const result = await query(
      `INSERT INTO weekly_goals (user_id, channel_id, iso_year, iso_week, target_videos, dias_publicacion, hora_corte)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, channel_id, iso_year, iso_week)
       DO UPDATE SET target_videos = EXCLUDED.target_videos,
                     dias_publicacion = EXCLUDED.dias_publicacion,
                     hora_corte = EXCLUDED.hora_corte,
                     updated_at = NOW()
       RETURNING target_videos, dias_publicacion, hora_corte`,
      [userId, channelId, isoYear, isoWeek, targetVideos, diasPublicacion, horaCorte]
    );

    return withSecurityHeaders(NextResponse.json({
      goal: {
        targetVideos: result.rows[0].target_videos,
        diasPublicacion: result.rows[0].dias_publicacion,
        horaCorte: result.rows[0].hora_corte,
      },
      channel: { id: channelId, name: channel.name },
      channelSource: channel.source,
      isoYear,
      isoWeek,
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 }));
    }
    return withSecurityHeaders(NextResponse.json({ error: 'Error al guardar meta semanal' }, { status: 500 }));
  }
}));
