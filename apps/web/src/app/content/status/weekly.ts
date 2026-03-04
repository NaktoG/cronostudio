export type WeeklyStatusKey = 'OK' | 'EN_RIESGO' | 'FALLIDA' | 'CUMPLIDA';

export const WEEKLY_STATUS_STYLES: Record<WeeklyStatusKey, { badge: string; dot: string; text: string }> = {
  OK: { badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400', text: 'text-emerald-200' },
  EN_RIESGO: { badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30', dot: 'bg-amber-400', text: 'text-amber-200' },
  FALLIDA: { badge: 'bg-red-500/15 text-red-300 border-red-500/30', dot: 'bg-red-400', text: 'text-red-200' },
  CUMPLIDA: { badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30', dot: 'bg-sky-400', text: 'text-sky-200' },
};

export const RECONCILE_SLOT_STYLES = {
  ok: { tone: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/40', dot: 'bg-emerald-400', label: 'OK' },
  missing_publish_event: { tone: 'bg-amber-400/15 text-amber-200 border-amber-400/40', dot: 'bg-amber-400', label: 'Registrar' },
  missing_youtube_video: { tone: 'bg-slate-400/10 text-slate-300 border-slate-400/30', dot: 'bg-slate-400', label: 'Sin video' },
  pending: { tone: 'bg-slate-400/10 text-slate-300 border-slate-400/30', dot: 'bg-slate-400', label: 'Pendiente' },
} as const;
