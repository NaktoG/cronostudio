export type ScriptStatus = 'draft' | 'review' | 'approved' | 'recorded';

export const SCRIPT_STATUS_LABELS: Record<ScriptStatus, string> = {
  draft: 'Borrador',
  review: 'En Revision',
  approved: 'Aprobado',
  recorded: 'Grabado',
};

export const SCRIPT_STATUS_BADGES: Record<ScriptStatus, string> = {
  draft: 'bg-gray-700',
  review: 'bg-yellow-700',
  approved: 'bg-emerald-700',
  recorded: 'bg-blue-700',
};
