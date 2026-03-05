import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ideasService } from '@/app/ideas/services/ideasService';
import { ideaPipelineService } from '@/app/ideas/services/ideaPipelineService';
import { evaluateIdeaReady } from '@/lib/ideaReady';
import { IDEAS_COPY } from '@/app/content/pages/ideas';
import type { IdeaStatus } from '@/app/content/status/ideas';

type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export type Idea = {
  id: string;
  title: string;
  description: string | null;
  channelId: string | null;
  status: IdeaStatus;
  priority: number;
  tags: string[];
  channel_name: string | null;
  created_at: string;
};

export type IdeaFormPayload = {
  title: string;
  description: string;
  priority: number;
  channelId?: string;
  tagsInput: string;
};

type UseIdeasOptions = {
  isAuthenticated: boolean;
  authFetch: AuthFetch;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
};

export function useIdeas({ isAuthenticated, authFetch, addToast }: UseIdeasOptions) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusErrors, setStatusErrors] = useState<Record<string, string[]>>({});
  const [pipelineLoading, setPipelineLoading] = useState<string[]>([]);
  const openNewRef = useRef(false);

  const normalizeTags = useCallback((input: string) =>
    input
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0), []);

  const refreshIdeas = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setListError(null);
      if (!isAuthenticated) {
        setIdeas([]);
        return;
      }
      const result = await ideasService.fetchIdeas(authFetch, selectedChannel || undefined, signal);
      if (result.error) {
        setListError(result.error);
      }
      setIdeas(result.ideas as Idea[]);
    } catch (err) {
      if (signal?.aborted) return;
      console.error('Error:', err);
      addToast(IDEAS_COPY.toasts.error, 'error');
      setListError(err instanceof Error ? err.message : IDEAS_COPY.toasts.error);
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  }, [isAuthenticated, authFetch, addToast, selectedChannel]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    refreshIdeas(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated, refreshIdeas]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedChannel = window.localStorage.getItem('cronostudio.channelId') || '';
    if (storedChannel && storedChannel !== selectedChannel) {
      setSelectedChannel(storedChannel);
    }
  }, [selectedChannel]);

  const tagSuggestions = useMemo(() => {
    const map = new Map<string, number>();
    ideas.forEach((idea) => {
      if (selectedChannel && idea.channelId !== selectedChannel) return;
      idea.tags?.forEach((tag) => {
        const key = tag.trim().toLowerCase();
        if (!key) return;
        map.set(key, (map.get(key) ?? 0) + 1);
      });
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag]) => tag);
  }, [ideas, selectedChannel]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const createOrUpdateIdea = useCallback(async (payload: IdeaFormPayload, editingId?: string | null) => {
    const body = {
      title: payload.title,
      description: payload.description,
      priority: payload.priority,
      tags: normalizeTags(payload.tagsInput),
      ...(payload.channelId ? { channelId: payload.channelId } : {}),
    };
    await ideasService.saveIdea(authFetch, body, editingId ?? undefined);
    await refreshIdeas();
  }, [authFetch, normalizeTags, refreshIdeas]);

  const deleteIdea = useCallback(async (id: string) => {
    await ideasService.deleteIdea(authFetch, id);
    await refreshIdeas();
  }, [authFetch, refreshIdeas]);

  const updateStatus = useCallback(async (id: string, status: IdeaStatus) => {
    try {
      if (status === 'approved') {
        const targetIdea = ideas.find((idea) => idea.id === id);
        if (targetIdea) {
          const readiness = evaluateIdeaReady(targetIdea.title, targetIdea.description);
          if (!readiness.isReady) {
            addToast(IDEAS_COPY.toasts.ideaNotReady, 'error');
            setStatusErrors((prev) => ({ ...prev, [id]: readiness.errors }));
            return;
          }
        }
      }
      await ideasService.updateIdeaStatus(authFetch, id, status);
      setStatusErrors((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await refreshIdeas();
      addToast(IDEAS_COPY.toasts.statusUpdated, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : IDEAS_COPY.toasts.error, 'error');
    }
  }, [ideas, authFetch, addToast, refreshIdeas]);

  const updateSelectedStatus = useCallback(async (status: IdeaStatus) => {
    if (selectedIds.length === 0) return;
    try {
      if (status === 'approved') {
        const nextErrors: Record<string, string[]> = {};
        const readyIds: string[] = [];

        selectedIds.forEach((id) => {
          const targetIdea = ideas.find((idea) => idea.id === id);
          if (!targetIdea) return;
          const readiness = evaluateIdeaReady(targetIdea.title, targetIdea.description);
          if (!readiness.isReady) {
            nextErrors[id] = readiness.errors;
          } else {
            readyIds.push(id);
          }
        });

        if (Object.keys(nextErrors).length > 0) {
          setStatusErrors((prev) => ({ ...prev, ...nextErrors }));
          addToast(IDEAS_COPY.toasts.ideaNotReady, 'error');
        }

        if (readyIds.length === 0) return;
        await Promise.all(readyIds.map((id) => updateStatus(id, status)));
        clearSelection();
        return;
      }

      await Promise.all(selectedIds.map((id) => updateStatus(id, status)));
      clearSelection();
    } catch {
      addToast(IDEAS_COPY.toasts.error, 'error');
    }
  }, [selectedIds, ideas, updateStatus, clearSelection, addToast]);

  const runPipeline = useCallback(async (idea: Idea) => {
    const channelId = idea.channelId ?? selectedChannel;
    if (!channelId) {
      addToast('Selecciona un canal para ejecutar el pipeline', 'error');
      return;
    }
    if (pipelineLoading.includes(idea.id)) return;
    setPipelineLoading((current) => [...current, idea.id]);
    try {
      await ideaPipelineService.runPipeline(authFetch, { channelId, ideaId: idea.id });
      await refreshIdeas();
      addToast('Pipeline completado (guion + SEO)', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Error al ejecutar pipeline', 'error');
    } finally {
      setPipelineLoading((current) => current.filter((id) => id !== idea.id));
    }
  }, [authFetch, addToast, refreshIdeas, selectedChannel, pipelineLoading]);

  return {
    state: {
      ideas,
      loading,
      listError,
      selectedChannel,
      selectedIds,
      statusErrors,
      pipelineLoading,
      tagSuggestions,
      openNewRef,
    },
    actions: {
      setSelectedChannel,
      refreshIdeas,
      toggleSelection,
      clearSelection,
      createOrUpdateIdea,
      deleteIdea,
      updateStatus,
      updateSelectedStatus,
      runPipeline,
    },
  };
}
