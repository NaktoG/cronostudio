import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { query } from '@/lib/db';
import { getDateFromIsoWeek, getIsoWeekInfo, startOfIsoWeek, endOfIsoWeek } from '@/lib/dates';
import { evaluateEstadoSemana, ProductionCheck, WeeklyGoalConfig, WeeklyPipelineState } from '@/lib/weeklyStatus';
import { isIdeaReady } from '@/lib/ideaReady';

export const dynamic = 'force-dynamic';

const DEFAULT_GOAL: WeeklyGoalConfig = {
  targetVideos: 2,
  diasPublicacion: ['tuesday', 'friday'],
  horaCorte: '12:00',
};

type WeeklyTask = {
  id: string;
  type: 'idea' | 'script' | 'thumbnail' | 'seo' | 'publish';
  title: string;
  productionTitle: string;
  productionId: string;
  urgency: 'high' | 'medium' | 'low';
  href: string;
};

type PublishedSummary = {
  id: string;
  title: string;
  publishedAt: string;
};

type PlannedProduction = {
  id: string;
  title: string;
  day: string | null;
  status: string;
};

type WeekStatus = {
  isoYear: number;
  isoWeek: number;
  status: 'OK' | 'EN_RIESGO' | 'FALLIDA';
};

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function resolveChannel(userId: string, channelId?: string | null) {
  if (channelId) {
    const result = await query(
      `SELECT id, name FROM channels WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [channelId, userId]
    );
    if (result.rows.length === 0) return null;
    return { ...result.rows[0], source: 'explicit' as const };
  }

  const result = await query(
    `SELECT id, name FROM channels WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
    [userId]
  );
  if (result.rows.length === 0) return null;
  return { ...result.rows[0], source: 'default' as const };
}

function isNonEmpty(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isScriptComplete(row: Record<string, unknown>) {
  return Boolean(row.script_id)
    && isNonEmpty(row.intro)
    && isNonEmpty(row.body)
    && isNonEmpty(row.cta)
    && isNonEmpty(row.outro);
}

function isThumbnailComplete(row: Record<string, unknown>) {
  const status = (row.thumbnail_status as string | null) ?? '';
  return Boolean(row.thumbnail_id) && (['designed', 'approved'].includes(status) || isNonEmpty(row.image_url));
}

function isSeoComplete(row: Record<string, unknown>) {
  const tags = (row.seo_tags as string[] | null) ?? [];
  return Boolean(row.seo_id)
    && isNonEmpty(row.seo_title)
    && isNonEmpty(row.seo_description)
    && tags.length >= 5;
}

function toProductionCheck(row: Record<string, unknown>): ProductionCheck {
  return {
    id: row.id as string,
    title: row.title as string,
    targetDate: row.target_date ? new Date(row.target_date as string) : null,
    scriptComplete: isScriptComplete(row),
    thumbnailComplete: isThumbnailComplete(row),
    seoComplete: isSeoComplete(row),
    published: row.status === 'published' || Boolean(row.published_at),
  };
}

type WeeklyComputed = {
  goal: WeeklyGoalConfig;
  state: WeeklyPipelineState;
  evaluation: ReturnType<typeof evaluateEstadoSemana>;
  publishedThisWeek: PublishedSummary[];
  plannedProductions: PlannedProduction[];
  planGenerated: boolean;
};

async function computeWeeklyData(
  userId: string,
  channelId: string,
  weekStart: Date,
  weekEnd: Date,
  nowForEval: Date
): Promise<WeeklyComputed> {
  const weekIsoInfo = getIsoWeekInfo(weekStart);
  const goalsResult = await query(
    `SELECT target_videos, dias_publicacion, hora_corte
     FROM weekly_goals
     WHERE user_id = $1 AND channel_id = $2 AND iso_year = $3 AND iso_week = $4`,
    [userId, channelId, weekIsoInfo.isoYear, weekIsoInfo.isoWeek]
  );

  const goal: WeeklyGoalConfig = goalsResult.rows.length > 0
    ? {
        targetVideos: goalsResult.rows[0].target_videos,
        diasPublicacion: goalsResult.rows[0].dias_publicacion,
        horaCorte: goalsResult.rows[0].hora_corte,
      }
    : DEFAULT_GOAL;

  const ideasParams: (string | null)[] = [userId, channelId];
  const ideasQuery = `SELECT title, description FROM ideas WHERE user_id = $1 AND channel_id = $2 AND status <> 'archived'`;
  const ideasResult = await query(ideasQuery, ideasParams);
  const ideasReady = ideasResult.rows.filter((row) => isIdeaReady(row.title as string, row.description as string | null)).length;

  const productionParams: (string | number | null)[] = [userId, channelId, weekIsoInfo.isoYear, weekIsoInfo.isoWeek];
  const productionQuery = `
    SELECT
      p.id,
      p.title,
      p.status,
      p.target_date,
      p.published_at,
      p.planned_publish_day,
      s.id as script_id,
      s.intro,
      s.body,
      s.cta,
      s.outro,
      t.id as thumbnail_id,
      t.status as thumbnail_status,
      t.image_url,
      seo.id as seo_id,
      seo.optimized_title as seo_title,
      seo.description as seo_description,
      seo.tags as seo_tags
    FROM productions p
    LEFT JOIN scripts s ON p.script_id = s.id
    LEFT JOIN thumbnails t ON p.thumbnail_id = t.id
    LEFT JOIN seo_data seo ON p.seo_id = seo.id
    WHERE p.user_id = $1 AND p.channel_id = $2 AND p.iso_year = $3 AND p.iso_week = $4
    ORDER BY p.planned_publish_day ASC NULLS LAST, p.created_at ASC
  `;

  const productionsResult = await query(productionQuery, productionParams);
  let productionRows = productionsResult.rows;

  if (productionRows.length === 0) {
    const fallbackParams: (string | null)[] = [userId, formatDate(weekStart), formatDate(weekEnd), channelId];
    const fallbackQuery = `
      SELECT
        p.id,
        p.title,
        p.status,
        p.target_date,
        p.published_at,
        p.planned_publish_day,
        s.id as script_id,
        s.intro,
        s.body,
        s.cta,
        s.outro,
        t.id as thumbnail_id,
        t.status as thumbnail_status,
        t.image_url,
        seo.id as seo_id,
        seo.optimized_title as seo_title,
        seo.description as seo_description,
        seo.tags as seo_tags
      FROM productions p
      LEFT JOIN scripts s ON p.script_id = s.id
      LEFT JOIN thumbnails t ON p.thumbnail_id = t.id
      LEFT JOIN seo_data seo ON p.seo_id = seo.id
      WHERE p.user_id = $1 AND p.target_date BETWEEN $2 AND $3 AND p.channel_id = $4
      ORDER BY p.target_date ASC NULLS LAST, p.created_at ASC
    `;
    const fallbackResult = await query(fallbackQuery, fallbackParams);
    productionRows = fallbackResult.rows;
  }

  const plannedProductions: PlannedProduction[] = productionRows.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    day: (row.planned_publish_day as string | null) ?? null,
    status: row.status as string,
  }));
  const planGenerated = plannedProductions.length >= 2;

  const productions = productionRows.map(toProductionCheck);
  const tuesdayRow = productionRows.find((row) => row.planned_publish_day === 'tuesday') ?? null;
  const fridayRow = productionRows.find((row) => row.planned_publish_day === 'friday') ?? null;
  const video1 = tuesdayRow
    ? productions.find((prod) => prod.id === tuesdayRow.id) ?? null
    : productions[0] ?? null;
  const video2 = fridayRow
    ? productions.find((prod) => prod.id === fridayRow.id) ?? null
    : productions[1] ?? null;

  const publishParams: (string | null)[] = [userId, weekStart.toISOString(), weekEnd.toISOString(), channelId];
  const publishQuery = `
    SELECT id, title, published_at
    FROM productions
    WHERE user_id = $1 AND published_at BETWEEN $2 AND $3 AND channel_id = $4
    ORDER BY published_at DESC LIMIT 10
  `;
  const publishedResult = await query(publishQuery, publishParams);
  const publishedThisWeek: PublishedSummary[] = publishedResult.rows.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    publishedAt: new Date(row.published_at as string).toISOString(),
  }));
  const publishedCount = publishedThisWeek.length;

  const state: WeeklyPipelineState = {
    ideasReady,
    video1,
    video2,
    publishedCount,
  };

  const evaluation = evaluateEstadoSemana(nowForEval, state, goal);

  return {
    goal,
    state,
    evaluation,
    publishedThisWeek,
    plannedProductions,
    planGenerated,
  };
}

async function calculateRacha(userId: string, channelId: string, now: Date) {
  const maxWeeks = 52;
  const statuses: WeekStatus[] = [];
  let currentStreak = 0;
  let bestStreak = 0;
  let runningStreak = 0;

  const currentWeekStart = startOfIsoWeek(now);

  for (let offset = maxWeeks - 1; offset >= 0; offset -= 1) {
    const weekStart = new Date(currentWeekStart.getTime());
    weekStart.setDate(currentWeekStart.getDate() - offset * 7);
    const weekEnd = endOfIsoWeek(weekStart);
    const weekInfo = getIsoWeekInfo(weekStart);
    const isCurrent = weekInfo.isoYear === getIsoWeekInfo(now).isoYear && weekInfo.isoWeek === getIsoWeekInfo(now).isoWeek;
    const evalNow = isCurrent ? now : new Date(weekEnd.getTime() + 60 * 1000);
    const computed = await computeWeeklyData(userId, channelId, weekStart, weekEnd, evalNow);
    statuses.push({ isoYear: weekInfo.isoYear, isoWeek: weekInfo.isoWeek, status: computed.evaluation.status });
  }

  for (const entry of statuses) {
    if (entry.status === 'FALLIDA') {
      runningStreak = 0;
    } else {
      runningStreak += 1;
      if (runningStreak > bestStreak) bestStreak = runningStreak;
    }
  }

  for (let i = statuses.length - 1; i >= 0; i -= 1) {
    if (statuses[i].status === 'FALLIDA') break;
    currentStreak += 1;
  }

  const last4Weeks = statuses.slice(-4);

  return {
    currentStreak,
    bestStreak,
    last4Weeks,
  };
}

function buildTasks(
  now: Date,
  goal: WeeklyGoalConfig,
  state: WeeklyPipelineState,
  conditions: ReturnType<typeof evaluateEstadoSemana>['conditions'],
  nextCondition: ReturnType<typeof evaluateEstadoSemana>['nextCondition']
): WeeklyTask[] {
  const dayMap: Record<number, string> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };
  const today = dayMap[now.getDay()];
  const publishDays = goal.diasPublicacion.map((day) => day.toLowerCase());
  const publishTask: WeeklyTask[] = [];
  if (publishDays.includes(today)) {
    const publishIndex = publishDays.indexOf(today);
    const targetProduction = publishIndex === 0 ? state.video1 : state.video2;
    if (targetProduction && !targetProduction.published) {
      publishTask.push({
        id: `publish-${targetProduction.id}`,
        type: 'publish',
        title: `Publicar ${targetProduction.title} (Marcar como publicado)`,
        productionTitle: targetProduction.title,
        productionId: targetProduction.id,
        urgency: 'high',
        href: '/',
      });
    }
  }

  const dueConditions = conditions.filter((condition) => now.getTime() >= condition.dueAt.getTime() && !condition.isMet);
  const targetConditions = dueConditions.length > 0 ? dueConditions : (nextCondition ? [nextCondition] : []);
  const tasks: WeeklyTask[] = [];

  const addTask = (task: WeeklyTask) => {
    tasks.push(task);
  };

  for (const condition of targetConditions) {
    const urgency: WeeklyTask['urgency'] = now.getTime() >= condition.dueAt.getTime() ? 'high' : 'medium';
    switch (condition.key) {
      case 'monday-ideas': {
        const missing = Math.max(goal.targetVideos - state.ideasReady, 0);
        if (missing > 0) {
          addTask({
            id: 'ideas-ready',
            type: 'idea',
            title: `Completar ${missing} ideas con DoD`,
            productionTitle: 'Ideas',
            productionId: '',
            urgency,
            href: '/ideas',
          });
        }
        break;
      }
      case 'tuesday-video1': {
        if (!state.video1) {
          addTask({
            id: 'video1-create',
            type: 'script',
            title: 'Crear video 1 para martes',
            productionTitle: 'Video 1',
            productionId: '',
            urgency,
            href: '/',
          });
          break;
        }
        if (!state.video1.scriptComplete) {
          addTask({
            id: 'video1-script',
            type: 'script',
            title: `Completar guion de ${state.video1.title}`,
            productionTitle: state.video1.title,
            productionId: state.video1.id,
            urgency,
            href: '/scripts',
          });
        }
        if (!state.video1.thumbnailComplete) {
          addTask({
            id: 'video1-thumbnail',
            type: 'thumbnail',
            title: `Completar miniatura de ${state.video1.title}`,
            productionTitle: state.video1.title,
            productionId: state.video1.id,
            urgency,
            href: '/thumbnails',
          });
        }
        if (!state.video1.seoComplete) {
          addTask({
            id: 'video1-seo',
            type: 'seo',
            title: `Completar SEO de ${state.video1.title}`,
            productionTitle: state.video1.title,
            productionId: state.video1.id,
            urgency,
            href: '/seo',
          });
        }
        break;
      }
      case 'wednesday-script': {
        if (!state.video2) {
          addTask({
            id: 'video2-create',
            type: 'script',
            title: 'Crear video 2 para viernes',
            productionTitle: 'Video 2',
            productionId: '',
            urgency,
            href: '/',
          });
          break;
        }
        if (!state.video2.scriptComplete) {
          addTask({
            id: 'video2-script',
            type: 'script',
            title: `Completar guion de ${state.video2.title}`,
            productionTitle: state.video2.title,
            productionId: state.video2.id,
            urgency,
            href: '/scripts',
          });
        }
        break;
      }
      case 'thursday-assets': {
        if (!state.video2) {
          addTask({
            id: 'video2-assets-missing',
            type: 'thumbnail',
            title: 'Preparar video 2 para viernes',
            productionTitle: 'Video 2',
            productionId: '',
            urgency,
            href: '/',
          });
          break;
        }
        if (!state.video2.thumbnailComplete) {
          addTask({
            id: 'video2-thumbnail',
            type: 'thumbnail',
            title: `Completar miniatura de ${state.video2.title}`,
            productionTitle: state.video2.title,
            productionId: state.video2.id,
            urgency,
            href: '/thumbnails',
          });
        }
        if (!state.video2.seoComplete) {
          addTask({
            id: 'video2-seo',
            type: 'seo',
            title: `Completar SEO de ${state.video2.title}`,
            productionTitle: state.video2.title,
            productionId: state.video2.id,
            urgency,
            href: '/seo',
          });
        }
        break;
      }
      case 'friday-publish': {
        if (!state.video2) {
          addTask({
            id: 'video2-publish-missing',
            type: 'publish',
            title: 'Publicar video 2',
            productionTitle: 'Video 2',
            productionId: '',
            urgency,
            href: '/',
          });
          break;
        }
        if (!state.video2.published) {
          addTask({
            id: 'video2-publish',
            type: 'publish',
            title: `Publicar ${state.video2.title}`,
            productionTitle: state.video2.title,
            productionId: state.video2.id,
            urgency,
            href: '/',
          });
        }
        break;
      }
      default:
        break;
    }
  }

  const urgencyOrder: Record<WeeklyTask['urgency'], number> = { high: 0, medium: 1, low: 2 };
  const sorted = tasks.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
  const merged = publishTask.length > 0 ? [...publishTask, ...sorted] : sorted;
  const unique = merged.filter((task, index) => merged.findIndex((item) => item.id === task.id) === index);
  return unique.slice(0, 3);
}

export async function GET(request: NextRequest) {
  try {
    const userId = (await getAuthUser(request))?.userId ?? null;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const { searchParams } = new URL(request.url);
    const channelIdParam = searchParams.get('channelId');
    const isoYearParam = searchParams.get('isoYear');
    const isoWeekParam = searchParams.get('isoWeek');

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
    const weekStart = isoYearParam || isoWeekParam
      ? getDateFromIsoWeek(isoYear, isoWeek)
      : startOfIsoWeek(now);
    const weekEnd = endOfIsoWeek(weekStart);
    const isoInfoFromStart = getIsoWeekInfo(weekStart);

    const channel = await resolveChannel(userId, channelIdParam);
    if (!channel) {
      return withSecurityHeaders(NextResponse.json({ error: 'Canal requerido' }, { status: 400 }));
    }
    const channelId = channel.id as string;

    const computed = await computeWeeklyData(userId, channelId, weekStart, weekEnd, now);
    const tasks = buildTasks(now, computed.goal, computed.state, computed.evaluation.conditions, computed.evaluation.nextCondition);
    const streak = await calculateRacha(userId, channelId, now);

    return withSecurityHeaders(NextResponse.json({
      status: computed.evaluation.status,
      nextCondition: computed.evaluation.nextCondition
        ? {
            label: computed.evaluation.nextCondition.label,
            dueAt: computed.evaluation.nextCondition.dueAt.toISOString(),
            missing: computed.evaluation.nextCondition.missing,
          }
        : null,
      channel: { id: channelId, name: channel.name },
      channelSource: channel.source,
      goal: computed.goal,
      week: {
        isoYear: isoInfoFromStart.isoYear,
        isoWeek: isoInfoFromStart.isoWeek,
        startDate: formatDate(weekStart),
        endDate: formatDate(weekEnd),
      },
      publishedCount: computed.state.publishedCount,
      publishedThisWeek: computed.publishedThisWeek,
      planGenerated: computed.planGenerated,
      plannedProductions: computed.plannedProductions,
      currentStreak: streak.currentStreak,
      bestStreak: streak.bestStreak,
      last4Weeks: streak.last4Weeks,
      tasks,
    }));
  } catch (error) {
    return withSecurityHeaders(NextResponse.json({ error: 'Error al evaluar la semana' }, { status: 500 }));
  }
}
