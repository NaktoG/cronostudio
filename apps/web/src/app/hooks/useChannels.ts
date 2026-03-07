import { useCallback, useEffect, useState } from 'react';

type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

type Channel = {
  id: string;
  name: string;
};

export function useChannels(options: { isAuthenticated: boolean; authFetch: AuthFetch }) {
  const { isAuthenticated, authFetch } = options;
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      if (!isAuthenticated) {
        setChannels([]);
        return;
      }
      const response = await authFetch('/api/channels', { signal });
      if (response.ok) {
        const data = (await response.json()) as Channel[];
        setChannels(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      if (signal?.aborted) return;
      setChannels([]);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [isAuthenticated, authFetch]);

  useEffect(() => {
    if (!isAuthenticated) {
      setChannels([]);
      return;
    }
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated, refresh]);

  return { channels, loading, refresh };
}
