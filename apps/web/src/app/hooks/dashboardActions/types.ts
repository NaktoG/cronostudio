import type { getDashboardCopy } from '@/app/content/dashboard';

export type ToastKind = 'success' | 'error' | 'warning';

export interface CommonActionDeps {
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  addToast: (message: string, kind?: ToastKind) => void;
  dashboardCopy: ReturnType<typeof getDashboardCopy>;
  fetchData: () => void;
}
