import type { Locale } from '@/app/i18n/messages';

export type ScriptStatus = 'draft' | 'review' | 'approved' | 'recorded';

const SCRIPT_STATUS_LABELS_BY_LOCALE: Record<Locale, Record<ScriptStatus, string>> = {
  es: {
    draft: 'Borrador',
    review: 'En revision',
    approved: 'Aprobado',
    recorded: 'Grabado',
  },
  en: {
    draft: 'Draft',
    review: 'In review',
    approved: 'Approved',
    recorded: 'Recorded',
  },
};

export function getScriptStatusLabels(locale: Locale): Record<ScriptStatus, string> {
  return SCRIPT_STATUS_LABELS_BY_LOCALE[locale] ?? SCRIPT_STATUS_LABELS_BY_LOCALE.es;
}

export const SCRIPT_STATUS_LABELS: Record<ScriptStatus, string> = getScriptStatusLabels('es');

export const SCRIPT_STATUS_BADGES: Record<ScriptStatus, string> = {
  draft: 'bg-gray-700',
  review: 'bg-yellow-700',
  approved: 'bg-emerald-700',
  recorded: 'bg-blue-700',
};
