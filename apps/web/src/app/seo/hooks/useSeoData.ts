import { useCallback, useEffect, useMemo, useState } from 'react';
import { seoService } from '@/app/seo/services/seoService';
import { copyToClipboard } from '@/lib/clipboard';
import { buildSeoClipboardPayload, SeoItem } from '@/app/seo/helpers/seoClipboard';
import type { SeoCopy } from '@/app/content/pages/seo';

type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export type SeoData = {
  id: string;
  optimized_title: string;
  description: string | null;
  tags: string[];
  keywords: string[];
  suggestions?: {
    titles?: Array<string | { title?: string }>;
    thumbnails?: Array<string | { text?: string }>;
    thumbnailTexts?: string[];
    topCombos?: Array<{ title?: string; thumbnailText?: string }>;
  } | null;
  score: number;
  video_title: string | null;
  youtube_video_id: string | null;
  created_at: string;
};

type UseSeoDataOptions = {
  isAuthenticated: boolean;
  authFetch: AuthFetch;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  seoCopy: SeoCopy;
};

export function useSeoData({ isAuthenticated, authFetch, addToast, seoCopy }: UseSeoDataOptions) {
  const [seoData, setSeoData] = useState<SeoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [ideaOptions, setIdeaOptions] = useState<{ id: string; title: string }[]>([]);
  const [scriptOptions, setScriptOptions] = useState<{ id: string; title: string }[]>([]);

  const refreshSeo = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      if (!isAuthenticated) {
        setSeoData([]);
        return;
      }
      const result = await seoService.fetchSeo(authFetch, selectedChannel || undefined, signal);
      if (result.error) {
        setError(result.error ?? seoCopy.errors.load);
      }
      setSeoData(result.items as SeoData[]);
    } catch (err) {
      if (signal?.aborted) return;
      addToast(seoCopy.errors.load, 'error');
      setError(err instanceof Error ? err.message : seoCopy.errors.load);
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  }, [isAuthenticated, authFetch, addToast, selectedChannel, seoCopy.errors.load]);

  useEffect(() => {
    const controller = new AbortController();
    refreshSeo(controller.signal);
    return () => controller.abort();
  }, [refreshSeo]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedChannel = window.localStorage.getItem('cronostudio.channelId') || '';
    if (storedChannel && storedChannel !== selectedChannel) {
      setSelectedChannel(storedChannel);
    }
  }, [selectedChannel]);

  const refreshIdeaOptions = useCallback(async (signal?: AbortSignal) => {
    try {
      if (!selectedChannel) {
        setIdeaOptions([]);
        return;
      }
      const data = await seoService.fetchIdeaOptions(authFetch, selectedChannel, signal);
      if (signal?.aborted) return;
      const options = Array.isArray(data)
        ? data.map((idea) => ({ id: (idea as { id: string }).id, title: (idea as { title: string }).title }))
        : [];
      setIdeaOptions(options);
    } catch {
      if (signal?.aborted) return;
      setIdeaOptions([]);
    }
  }, [authFetch, selectedChannel]);

  const refreshScriptOptions = useCallback(async (signal?: AbortSignal) => {
    try {
      if (!selectedChannel) {
        setScriptOptions([]);
        return;
      }
      const data = await seoService.fetchScriptOptions(authFetch, selectedChannel, signal);
      if (signal?.aborted) return;
      const options = Array.isArray(data)
        ? data.map((script) => ({ id: (script as { id: string }).id, title: (script as { title: string }).title }))
        : [];
      setScriptOptions(options);
    } catch {
      if (signal?.aborted) return;
      setScriptOptions([]);
    }
  }, [authFetch, selectedChannel]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    refreshIdeaOptions(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated, refreshIdeaOptions]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    refreshScriptOptions(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated, refreshScriptOptions]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const selectedItems = useMemo(() => seoData.filter((item) => selectedIds.includes(item.id)), [seoData, selectedIds]);

  const copySelected = useCallback(async (type: 'title' | 'description' | 'tags') => {
    if (selectedItems.length === 0) return;
    try {
      const payload = buildSeoClipboardPayload(selectedItems.map((item) => ({
        id: item.id,
        title: item.optimized_title,
        description: item.description || '',
        tags: item.tags || [],
      })) as SeoItem[], type);
      await copyToClipboard(payload);
      addToast(seoCopy.toasts.copied, 'success');
    } catch {
      addToast(seoCopy.toasts.error, 'error');
    }
  }, [selectedItems, addToast, seoCopy.toasts.copied, seoCopy.toasts.error]);

  const copyItem = useCallback(async (item: SeoData, type: 'title' | 'description' | 'tags') => {
    try {
      const payload = buildSeoClipboardPayload([
        { id: item.id, title: item.optimized_title, description: item.description || '', tags: item.tags || [] },
      ] as SeoItem[], type);
      await copyToClipboard(payload);
      addToast(seoCopy.toasts.copied, 'success');
    } catch {
      addToast(seoCopy.toasts.error, 'error');
    }
  }, [addToast, seoCopy.toasts.copied, seoCopy.toasts.error]);

  return {
    state: {
      seoData,
      loading,
      error,
      selectedChannel,
      selectedIds,
      ideaOptions,
      scriptOptions,
    },
    actions: {
      setSelectedChannel,
      refreshSeo,
      toggleSelection,
      clearSelection,
      copySelected,
      copyItem,
    },
  };
}
