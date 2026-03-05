import { useCallback, useEffect, useState } from 'react';
import { scriptsService } from '@/app/scripts/services/scriptsService';
import { scriptPipelineService } from '@/app/scripts/services/scriptPipelineService';
import { SCRIPTS_COPY } from '@/app/content/pages/scripts';

type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export type Script = {
  id: string;
  title: string;
  intro: string | null;
  body: string | null;
  cta: string | null;
  outro: string | null;
  status: string;
  word_count: number;
  estimated_duration_seconds: number;
  idea_id?: string | null;
  idea_title: string | null;
  created_at: string;
};

export type IdeaOption = {
  id: string;
  title: string;
};

type UseScriptsOptions = {
  isAuthenticated: boolean;
  authFetch: AuthFetch;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
};

export function useScripts({ isAuthenticated, authFetch, addToast }: UseScriptsOptions) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [ideaOptions, setIdeaOptions] = useState<IdeaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pipelineLoading, setPipelineLoading] = useState<string[]>([]);

  const refreshScripts = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setListError(null);
      if (!isAuthenticated) {
        setScripts([]);
        return;
      }
      const result = await scriptsService.fetchScripts(authFetch, selectedChannel || undefined, signal);
      if (result.error) {
        setListError(result.error);
      }
      setScripts(result.scripts as Script[]);
    } catch (err) {
      if (signal?.aborted) return;
      console.error('Error:', err);
      addToast(SCRIPTS_COPY.toasts.error, 'error');
      setListError(err instanceof Error ? err.message : SCRIPTS_COPY.toasts.error);
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  }, [isAuthenticated, authFetch, addToast, selectedChannel]);

  useEffect(() => {
    const controller = new AbortController();
    refreshScripts(controller.signal);
    return () => controller.abort();
  }, [refreshScripts]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedChannel = window.localStorage.getItem('cronostudio.channelId') || '';
    if (storedChannel && storedChannel !== selectedChannel) {
      setSelectedChannel(storedChannel);
    }
  }, [selectedChannel]);

  const refreshIdeaOptions = useCallback(async (signal?: AbortSignal) => {
    if (!selectedChannel) {
      setIdeaOptions([]);
      return;
    }
    try {
      const data = await scriptsService.fetchIdeas(authFetch, selectedChannel, signal);
      const options = Array.isArray(data)
        ? data.map((idea) => ({ id: (idea as { id: string }).id, title: (idea as { title: string }).title }))
        : [];
      setIdeaOptions(options);
    } catch (err) {
      if (signal?.aborted) return;
      console.error('Error fetching ideas:', err);
    }
  }, [authFetch, selectedChannel]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    refreshIdeaOptions(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated, refreshIdeaOptions]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const createOrUpdateScript = useCallback(async (payload: Record<string, unknown>, editingId?: string | null) => {
    await scriptsService.saveScript(authFetch, payload, editingId ?? undefined);
    await refreshScripts();
  }, [authFetch, refreshScripts]);

  const deleteScript = useCallback(async (id: string) => {
    await scriptsService.deleteScript(authFetch, id);
    await refreshScripts();
  }, [authFetch, refreshScripts]);

  const updateSelectedStatus = useCallback(async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => scriptsService.updateScriptStatus(authFetch, id, status)));
      clearSelection();
      await refreshScripts();
      addToast(SCRIPTS_COPY.toasts.updated, 'success');
    } catch {
      addToast(SCRIPTS_COPY.toasts.error, 'error');
    }
  }, [selectedIds, authFetch, clearSelection, refreshScripts, addToast]);

  const runPipeline = useCallback(async (script: Script) => {
    const channelId = selectedChannel;
    if (!channelId) {
      addToast('Selecciona un canal para ejecutar el pipeline', 'error');
      return;
    }
    if (pipelineLoading.includes(script.id)) return;
    setPipelineLoading((current) => [...current, script.id]);
    try {
      await scriptPipelineService.runPipeline(authFetch, {
        channelId,
        scriptId: script.id,
        ideaId: script.idea_id,
        title: script.title,
      });
      await refreshScripts();
      addToast('Pipeline completado (SEO + miniatura)', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Error al ejecutar pipeline', 'error');
    } finally {
      setPipelineLoading((current) => current.filter((id) => id !== script.id));
    }
  }, [authFetch, addToast, refreshScripts, selectedChannel, pipelineLoading]);

  return {
    state: {
      scripts,
      ideaOptions,
      loading,
      listError,
      selectedChannel,
      selectedIds,
      pipelineLoading,
    },
    actions: {
      setSelectedChannel,
      refreshScripts,
      refreshIdeaOptions,
      toggleSelection,
      clearSelection,
      createOrUpdateScript,
      deleteScript,
      updateSelectedStatus,
      runPipeline,
    },
  };
}
