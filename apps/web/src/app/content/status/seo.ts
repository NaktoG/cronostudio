import type { Locale } from '@/app/i18n/messages';

export const SEO_SCORE_THRESHOLDS = {
  excellent: 80,
  good: 60,
  ok: 40,
} as const;

const SEO_SCORE_LABELS_BY_LOCALE = {
  es: {
    excellent: 'Excelente',
    good: 'Bien',
    ok: 'Aceptable',
    bad: 'Mejorar',
  },
  en: {
    excellent: 'Excellent',
    good: 'Good',
    ok: 'Acceptable',
    bad: 'Improve',
  },
} as const;

export function getSeoScoreLabels(locale: Locale) {
  return SEO_SCORE_LABELS_BY_LOCALE[locale] ?? SEO_SCORE_LABELS_BY_LOCALE.es;
}

export const SEO_SCORE_LABELS = getSeoScoreLabels('es');

export function getSeoScoreLabel(score: number): keyof typeof SEO_SCORE_LABELS {
  if (score >= SEO_SCORE_THRESHOLDS.excellent) return 'excellent';
  if (score >= SEO_SCORE_THRESHOLDS.good) return 'good';
  if (score >= SEO_SCORE_THRESHOLDS.ok) return 'ok';
  return 'bad';
}
