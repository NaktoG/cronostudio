import { useCallback, useState } from 'react';
import type { Idea, IdeaFormData, IdeaUpdatePayload } from '@/domain/types';
import { ideasService } from '@/services/ideasService';
import type { AuthFetch } from '@/services/types';

export type UseIdeasState = {
  ideas: Idea[];
  loading: boolean;
  error: string | null;
};

export function useIdeas(authFetch: AuthFetch, isAuthenticated: boolean) {
  const [state, setState] = useState<UseIdeasState>({ ideas: [], loading: true, error: null });

  const fetchIdeas = useCallback(async () => {
    if (!isAuthenticated) {
      setState({ ideas: [], loading: false, error: null });
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const ideas = await ideasService.list(authFetch);
      setState({ ideas, loading: false, error: null });
    } catch (error) {
      setState({ ideas: [], loading: false, error: error instanceof Error ? error.message : 'Error' });
    }
  }, [authFetch, isAuthenticated]);

  const createIdea = useCallback(async (payload: IdeaFormData) => {
    return ideasService.create(authFetch, payload);
  }, [authFetch]);

  const updateIdea = useCallback(async (id: string, payload: IdeaUpdatePayload) => {
    return ideasService.update(authFetch, id, payload);
  }, [authFetch]);

  const deleteIdea = useCallback(async (id: string) => {
    return ideasService.remove(authFetch, id);
  }, [authFetch]);

  return {
    ...state,
    fetchIdeas,
    createIdea,
    updateIdea,
    deleteIdea,
  };
}
