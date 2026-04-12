type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function ensureOk(response: Response, fallbackMessage = 'Request failed'): Promise<Response> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = (data as { error?: string }).error || fallbackMessage;
    throw new Error(message);
  }
  return response;
}

export const ideasService = {
  async fetchIdeas(authFetch: AuthFetch, channelId?: string, signal?: AbortSignal) {
    const query = channelId ? `?channelId=${channelId}` : '';
    const response = await authFetch(`/api/ideas${query}`, { signal });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return { ideas: [], error: data?.error || null };
    }
    const ideas = await parseJson<unknown[]>(response);
    return { ideas, error: null };
  },

  async fetchChannels(authFetch: AuthFetch, signal?: AbortSignal) {
    const response = await authFetch('/api/channels', { signal });
    if (!response.ok) return [];
    return await parseJson<unknown[]>(response);
  },

  async saveIdea(authFetch: AuthFetch, payload: Record<string, unknown>, id?: string) {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/ideas?id=${id}` : '/api/ideas';
    const response = await ensureOk(await authFetch(url, {
      method,
      body: JSON.stringify(payload),
    }));
    return await parseJson(response);
  },

  async deleteIdea(authFetch: AuthFetch, id: string) {
    await ensureOk(await authFetch(`/api/ideas?id=${id}`, { method: 'DELETE' }));
  },

  async updateIdeaStatus(authFetch: AuthFetch, id: string, status: string) {
    await ensureOk(await authFetch(`/api/ideas?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }));
  },
};
