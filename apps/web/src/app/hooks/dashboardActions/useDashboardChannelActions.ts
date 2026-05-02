import { useCallback } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface UseDashboardChannelActionsParams {
  setSelectedChannelId: (value: string) => void;
  searchParamsKey: string;
  searchParams: URLSearchParams | null;
  router: AppRouterInstance;
}

export function useDashboardChannelActions({
  setSelectedChannelId,
  searchParamsKey,
  searchParams,
  router,
}: UseDashboardChannelActionsParams) {
  const handleChannelChange = useCallback((value: string) => {
    setSelectedChannelId(value);
    if (typeof window !== 'undefined') {
      if (value) window.localStorage.setItem('cronostudio.channelId', value);
      else window.localStorage.removeItem('cronostudio.channelId');
    }
    const routeParams = new URLSearchParams(searchParams?.toString() ?? searchParamsKey);
    if (value) routeParams.set('channelId', value);
    else routeParams.delete('channelId');
    const query = routeParams.toString();
    router.replace(query ? `/?${query}` : '/');
  }, [setSelectedChannelId, searchParams, searchParamsKey, router]);

  return { handleChannelChange };
}
