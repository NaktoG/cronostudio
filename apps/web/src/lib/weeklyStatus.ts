import { endOfIsoWeek, getWeekdayDate, setTimeOnDate, startOfIsoWeek } from '@/lib/dates';

export type WeeklyGoalConfig = {
  targetVideos: number;
  diasPublicacion: string[];
  horaCorte: string;
};

export type ProductionCheck = {
  id: string;
  title: string;
  targetDate: Date | null;
  scriptComplete: boolean;
  thumbnailComplete: boolean;
  seoComplete: boolean;
  published: boolean;
};

export type WeeklyPipelineState = {
  ideasReady: number;
  video1: ProductionCheck | null;
  video2: ProductionCheck | null;
  publishedCount: number;
};

export type WeeklyCondition = {
  key: string;
  label: string;
  dueAt: Date;
  isMet: boolean;
  missing: string[];
};

export type WeeklyStatusResult = {
  status: 'OK' | 'EN_RIESGO' | 'FALLIDA';
  nextCondition: WeeklyCondition | null;
  conditions: WeeklyCondition[];
};

function buildConditions(now: Date, state: WeeklyPipelineState, goal: WeeklyGoalConfig): WeeklyCondition[] {
  const start = startOfIsoWeek(now);
  const monday = new Date(start.getTime());
  const tuesday = getWeekdayDate(start, goal.diasPublicacion[0] || 'tuesday') ?? getWeekdayDate(start, 'tuesday');
  const friday = getWeekdayDate(start, goal.diasPublicacion[1] || 'friday') ?? getWeekdayDate(start, 'friday');
  const wednesday = getWeekdayDate(start, 'wednesday');
  const thursday = getWeekdayDate(start, 'thursday');

  const mondayDue = setTimeOnDate(monday, '23:59');
  const tuesdayDue = tuesday ? setTimeOnDate(tuesday, goal.horaCorte) : mondayDue;
  const wednesdayDue = wednesday ? setTimeOnDate(wednesday, '23:59') : mondayDue;
  const thursdayDue = thursday ? setTimeOnDate(thursday, '23:59') : mondayDue;
  const fridayDue = friday ? setTimeOnDate(friday, '23:59') : mondayDue;

  const missingIdeas = state.ideasReady >= goal.targetVideos ? [] : [`Faltan ${goal.targetVideos - state.ideasReady} ideas completas`];
  const conditions: WeeklyCondition[] = [
    {
      key: 'monday-ideas',
      label: `Lunes: ${goal.targetVideos} ideas completas`,
      dueAt: mondayDue,
      isMet: missingIdeas.length === 0,
      missing: missingIdeas,
    },
  ];

  const video1 = state.video1;
  const missingVideo1: string[] = [];
  if (!video1?.scriptComplete) missingVideo1.push('Guion');
  if (!video1?.thumbnailComplete) missingVideo1.push('Miniatura');
  if (!video1?.seoComplete) missingVideo1.push('SEO');
  conditions.push({
    key: 'tuesday-video1',
    label: 'Martes 12:00: Video 1 listo (guion + miniatura + SEO)',
    dueAt: tuesdayDue,
    isMet: missingVideo1.length === 0,
    missing: missingVideo1,
  });

  const video2 = state.video2;
  const missingScriptV2 = video2?.scriptComplete ? [] : ['Guion'];
  const missingAssetsV2: string[] = [];
  if (!video2?.thumbnailComplete) missingAssetsV2.push('Miniatura');
  if (!video2?.seoComplete) missingAssetsV2.push('SEO');

  conditions.push({
    key: 'wednesday-script',
    label: 'Miércoles: Guion video 2 completo',
    dueAt: wednesdayDue,
    isMet: missingScriptV2.length === 0,
    missing: missingScriptV2,
  });

  conditions.push({
    key: 'thursday-assets',
    label: 'Jueves: Miniatura + SEO video 2 completos',
    dueAt: thursdayDue,
    isMet: missingAssetsV2.length === 0,
    missing: missingAssetsV2,
  });

  conditions.push({
    key: 'friday-publish',
    label: 'Viernes: Video 2 publicado',
    dueAt: fridayDue,
    isMet: Boolean(video2?.published),
    missing: video2?.published ? [] : ['Publicar video 2'],
  });

  return conditions;
}

export function evaluateEstadoSemana(now: Date, state: WeeklyPipelineState, goal: WeeklyGoalConfig): WeeklyStatusResult {
  const conditions = buildConditions(now, state, goal);
  const weekStart = startOfIsoWeek(now);
  const publishDay = goal.diasPublicacion[1] || 'friday';
  const friday = getWeekdayDate(weekStart, publishDay) ?? getWeekdayDate(weekStart, 'friday') ?? endOfIsoWeek(now);
  const fridayEnd = setTimeOnDate(friday, '23:59');
  const weekFailed = now.getTime() > fridayEnd.getTime() && state.publishedCount < goal.targetVideos;

  if (weekFailed) {
    return {
      status: 'FALLIDA',
      nextCondition: null,
      conditions,
    };
  }

  const overdue = conditions.find((condition) => now.getTime() >= condition.dueAt.getTime() && !condition.isMet);
  const status = overdue ? 'EN_RIESGO' : 'OK';
  const nextCondition = conditions.find((condition) => now.getTime() < condition.dueAt.getTime() && !condition.isMet) ?? null;

  return {
    status,
    nextCondition,
    conditions,
  };
}
