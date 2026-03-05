export type IdeaStatus = 'draft' | 'approved' | 'in_production' | 'completed' | 'archived';

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  draft: 'Borrador',
  approved: 'Aprobada',
  in_production: 'En Produccion',
  completed: 'Completada',
  archived: 'Archivada',
};

export const IDEA_STATUS_BADGES: Record<IdeaStatus, string> = {
  draft: 'bg-gray-700',
  approved: 'bg-emerald-700',
  in_production: 'bg-yellow-700',
  completed: 'bg-blue-700',
  archived: 'bg-slate-700',
};
