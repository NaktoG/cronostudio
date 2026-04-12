import type { Locale } from '@/app/i18n/messages';

export type IdeaStatus = 'draft' | 'approved' | 'in_production' | 'completed' | 'archived';

const IDEA_STATUS_LABELS_BY_LOCALE: Record<Locale, Record<IdeaStatus, string>> = {
  es: {
    draft: 'Borrador',
    approved: 'Aprobada',
    in_production: 'En produccion',
    completed: 'Completada',
    archived: 'Archivada',
  },
  en: {
    draft: 'Draft',
    approved: 'Approved',
    in_production: 'In production',
    completed: 'Completed',
    archived: 'Archived',
  },
};

export function getIdeaStatusLabels(locale: Locale): Record<IdeaStatus, string> {
  return IDEA_STATUS_LABELS_BY_LOCALE[locale] ?? IDEA_STATUS_LABELS_BY_LOCALE.es;
}

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = getIdeaStatusLabels('es');

export const IDEA_STATUS_BADGES: Record<IdeaStatus, string> = {
  draft: 'bg-gray-700',
  approved: 'bg-emerald-700',
  in_production: 'bg-yellow-700',
  completed: 'bg-blue-700',
  archived: 'bg-slate-700',
};
