type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export const seoService = {
  async fetchSeo(authFetch: AuthFetch, channelId?: string, signal?: AbortSignal) {
    const query = channelId ? `?channelId=${channelId}` : '';
    const response = await authFetch(`/api/seo${query}`, { signal });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return { items: [], error: data?.error || 'Error al cargar SEO' };
    }
    const items = await parseJson<unknown[]>(response);
    return { items, error: null };
  },

  async fetchIdeaOptions(authFetch: AuthFetch, channelId: string, signal?: AbortSignal) {
    const response = await authFetch(`/api/ideas?channelId=${channelId}`, { signal });
    if (!response.ok) return [];
    return await parseJson<unknown[]>(response);
  },

  async fetchScriptOptions(authFetch: AuthFetch, channelId: string, signal?: AbortSignal) {
    const response = await authFetch(`/api/scripts?channelId=${channelId}`, { signal });
    if (!response.ok) return [];
    return await parseJson<unknown[]>(response);
  },
};
