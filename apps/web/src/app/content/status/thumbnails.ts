import type { Locale } from '@/app/i18n/messages';

export type ThumbnailStatus = 'pending' | 'designing' | 'designed' | 'approved';

const THUMBNAIL_STATUS_LABELS_BY_LOCALE: Record<Locale, Record<ThumbnailStatus, string>> = {
  es: {
    pending: 'Pendiente',
    designing: 'Disenando',
    designed: 'Disenada',
    approved: 'Aprobada',
  },
  en: {
    pending: 'Pending',
    designing: 'Designing',
    designed: 'Designed',
    approved: 'Approved',
  },
};

export function getThumbnailStatusLabels(locale: Locale): Record<ThumbnailStatus, string> {
  return THUMBNAIL_STATUS_LABELS_BY_LOCALE[locale] ?? THUMBNAIL_STATUS_LABELS_BY_LOCALE.es;
}

export const THUMBNAIL_STATUS_LABELS: Record<ThumbnailStatus, string> = getThumbnailStatusLabels('es');

export const THUMBNAIL_STATUS_BADGES: Record<ThumbnailStatus, string> = {
  pending: 'bg-gray-700',
  designing: 'bg-yellow-700',
  designed: 'bg-blue-700',
  approved: 'bg-emerald-700',
};
