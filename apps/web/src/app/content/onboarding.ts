import type { Locale } from '@/app/i18n/messages';

const ONBOARDING_COPY_BY_LOCALE = {
  es: {
    badge: 'Onboarding creativo',
    title: 'Guía viva para producir contenido sin perder el ritmo',
    subtitle: 'Usa esta ruta para conectar tu canal, planificar entregables y automatizar la medición semanal.',
    goalLabel: 'Objetivo actual',
    progressLabel: 'Progreso',
    calculating: 'Calculando...',
    completedOf: (done: number, total: number) => `${done} / ${total} completados`,
    nextStepLabel: 'Siguiente paso',
    purposeTitle: 'Para qué sirve',
    purposeDescription: 'CronoStudio organiza la producción y automatiza el seguimiento para que puedas publicar con foco creativo.',
    purposePipeline: 'Claridad de pipeline y entregables por semana.',
    purposeYoutube: 'Conexiones y sincronización directa con YouTube.',
    purposeAlerts: 'Alertas de disciplina y métrica semanal.',
    shortcutTitle: 'Atajo',
    shortcutHint: 'Podés volver a esta guía desde el menú principal.',
    goToAiStudio: 'Ir directo a AI Studio',
    goToDashboard: 'Ir al Dashboard',
    stepPrefix: 'Paso',
  },
  en: {
    badge: 'Creative onboarding',
    title: 'A living guide to produce content without losing momentum',
    subtitle: 'Use this path to connect your channel, plan deliverables, and automate weekly tracking.',
    goalLabel: 'Current goal',
    progressLabel: 'Progress',
    calculating: 'Calculating...',
    completedOf: (done: number, total: number) => `${done} / ${total} completed`,
    nextStepLabel: 'Next step',
    purposeTitle: 'What it does',
    purposeDescription: 'CronoStudio organizes production and automates tracking so you can publish with creative focus.',
    purposePipeline: 'Pipeline clarity and weekly deliverables.',
    purposeYoutube: 'Direct connections and sync with YouTube.',
    purposeAlerts: 'Discipline alerts and weekly metrics.',
    shortcutTitle: 'Shortcut',
    shortcutHint: 'You can return to this guide from the main menu.',
    goToAiStudio: 'Go to AI Studio',
    goToDashboard: 'Go to Dashboard',
    stepPrefix: 'Step',
  },
} as const;

export function getOnboardingCopy(locale: Locale) {
  return ONBOARDING_COPY_BY_LOCALE[locale] ?? ONBOARDING_COPY_BY_LOCALE.es;
}

export const ONBOARDING_GOALS_BY_LOCALE = {
  es: {
    first_publish: {
      title: 'Publicar tu primer video completo.',
      subtitle: 'Idea → Guión → Miniatura → Publicación',
    },
  },
  en: {
    first_publish: {
      title: 'Publish your first complete video.',
      subtitle: 'Idea → Script → Thumbnail → Publish',
    },
  },
} as const;

export function getOnboardingGoals(locale: Locale) {
  return ONBOARDING_GOALS_BY_LOCALE[locale] ?? ONBOARDING_GOALS_BY_LOCALE.es;
}

export const ONBOARDING_GOALS = ONBOARDING_GOALS_BY_LOCALE.es;

export const ONBOARDING_STORAGE_KEYS = {
  channelId: 'cronostudio.channelId',
  goalKey: 'cronostudio.onboarding.goal',
} as const;
