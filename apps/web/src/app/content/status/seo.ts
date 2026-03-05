export const SEO_SCORE_THRESHOLDS = {
  excellent: 80,
  good: 60,
  ok: 40,
} as const;

export const SEO_SCORE_LABELS = {
  excellent: 'Excelente',
  good: 'Bien',
  ok: 'Aceptable',
  bad: 'Mejorar',
} as const;

export function getSeoScoreLabel(score: number): keyof typeof SEO_SCORE_LABELS {
  if (score >= SEO_SCORE_THRESHOLDS.excellent) return 'excellent';
  if (score >= SEO_SCORE_THRESHOLDS.good) return 'good';
  if (score >= SEO_SCORE_THRESHOLDS.ok) return 'ok';
  return 'bad';
}
