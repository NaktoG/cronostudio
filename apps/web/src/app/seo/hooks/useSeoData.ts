import { useCallback, useEffect, useMemo, useState } from 'react';
import { seoService } from '@/app/seo/services/seoService';
import { copyToClipboard } from '@/lib/clipboard';
import { buildSeoClipboardPayload, SeoItem } from '@/app/seo/helpers/seoClipboard';
import { SEO_COPY } from '@/app/content/pages/seo';

type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export type SeoData = {
  id: string;
  optimized_title: string;
  description: string | null;
  tags: string[];
  keywords: string[];
  suggestions?: {
    titles?: string[];
    thumbnailTexts?: string[];
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
};

export function useSeoData({ isAuthenticated, authFetch, addToast }: UseSeoDataOptions) {
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
        setError(result.error);
      }
      setSeoData(result.items as SeoData[]);
    } catch (err) {
      if (signal?.aborted) return;
      addToast(SEO_COPY.toasts.error, 'error');
      setError(err instanceof Error ? err.message : SEO_COPY.toasts.error);
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  }, [isAuthenticated, authFetch, addToast, selectedChannel]);

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
    if (!selectedChannel) {
      setIdeaOptions([]);
      return;
    }
    const data = await seoService.fetchIdeaOptions(authFetch, selectedChannel, signal);
    const options = Array.isArray(data)
      ? data.map((idea) => ({ id: (idea as { id: string }).id, title: (idea as { title: string }).title }))
      : [];
    setIdeaOptions(options);
  }, [authFetch, selectedChannel]);

  const refreshScriptOptions = useCallback(async (signal?: AbortSignal) => {
    if (!selectedChannel) {
      setScriptOptions([]);
      return;
    }
    const data = await seoService.fetchScriptOptions(authFetch, selectedChannel, signal);
    const options = Array.isArray(data)
      ? data.map((script) => ({ id: (script as { id: string }).id, title: (script as { title: string }).title }))
      : [];
    setScriptOptions(options);
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
      addToast(SEO_COPY.toasts.copied, 'success');
    } catch {
      addToast(SEO_COPY.toasts.error, 'error');
    }
  }, [selectedItems, addToast]);

  const copyItem = useCallback(async (item: SeoData, type: 'title' | 'description' | 'tags') => {
    try {
      const payload = buildSeoClipboardPayload([
        { id: item.id, title: item.optimized_title, description: item.description || '', tags: item.tags || [] },
      ] as SeoItem[], type);
      await copyToClipboard(payload);
      addToast(SEO_COPY.toasts.copied, 'success');
    } catch {
      addToast(SEO_COPY.toasts.error, 'error');
    }
  }, [addToast]);

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
