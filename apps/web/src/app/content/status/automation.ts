export type AutomationStatus = 'running' | 'completed' | 'error';

export const AUTOMATION_STATUS_STYLES: Record<AutomationStatus, { dot: string; badge: string; label: string }> = {
  running: { dot: 'bg-yellow-400', badge: 'bg-yellow-400/10 text-yellow-300', label: 'En progreso' },
  completed: { dot: 'bg-emerald-400', badge: 'bg-emerald-400/10 text-emerald-300', label: 'Completado' },
  error: { dot: 'bg-red-400', badge: 'bg-red-400/10 text-red-300', label: 'Error' },
};
