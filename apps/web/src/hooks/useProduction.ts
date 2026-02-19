import { useCallback, useState } from 'react';
import type { Production } from '@/domain/types';
import { productionsService } from '@/services/productionsService';
import type { AuthFetch } from '@/services/types';

export type UseProductionState = {
  production: Production | null;
  loading: boolean;
  error: string | null;
};

export function useProduction(authFetch: AuthFetch, isAuthenticated: boolean) {
  const [state, setState] = useState<UseProductionState>({
    production: null,
    loading: true,
    error: null,
  });

  const fetchProduction = useCallback(
    async (id: string) => {
      if (!isAuthenticated) {
        setState({ production: null, loading: false, error: null });
        return;
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const production = await productionsService.getById(authFetch, id);
        setState({ production, loading: false, error: null });
      } catch (error) {
        setState({ production: null, loading: false, error: error instanceof Error ? error.message : 'Error' });
      }
    },
    [authFetch, isAuthenticated]
  );

  return {
    ...state,
    fetchProduction,
  };
}
