export type ThumbnailStatus = 'pending' | 'designing' | 'designed' | 'approved';

export const THUMBNAIL_STATUS_LABELS: Record<ThumbnailStatus, string> = {
  pending: 'Pendiente',
  designing: 'Diseñando',
  designed: 'Diseñado',
  approved: 'Aprobada',
};

export const THUMBNAIL_STATUS_BADGES: Record<ThumbnailStatus, string> = {
  pending: 'bg-gray-700',
  designing: 'bg-yellow-700',
  designed: 'bg-blue-700',
  approved: 'bg-emerald-700',
};
