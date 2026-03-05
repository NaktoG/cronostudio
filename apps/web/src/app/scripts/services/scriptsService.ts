type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function ensureOk(response: Response): Promise<Response> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = (data as { error?: string }).error || 'Solicitud fallida';
    throw new Error(message);
  }
  return response;
}

export const scriptsService = {
  async fetchScripts(authFetch: AuthFetch, channelId?: string, signal?: AbortSignal) {
    const query = channelId ? `?channelId=${channelId}` : '';
    const response = await authFetch(`/api/scripts${query}`, { signal });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return { scripts: [], error: data?.error || 'Error al cargar guiones' };
    }
    const scripts = await parseJson<unknown[]>(response);
    return { scripts, error: null };
  },

  async fetchIdeas(authFetch: AuthFetch, channelId: string, signal?: AbortSignal) {
    const response = await authFetch(`/api/ideas?channelId=${channelId}`, { signal });
    if (!response.ok) return [];
    return await parseJson<unknown[]>(response);
  },

  async saveScript(authFetch: AuthFetch, payload: Record<string, unknown>, id?: string) {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/scripts?id=${id}` : '/api/scripts';
    const response = await ensureOk(await authFetch(url, {
      method,
      body: JSON.stringify(payload),
    }));
    return await parseJson(response);
  },

  async deleteScript(authFetch: AuthFetch, id: string) {
    await ensureOk(await authFetch(`/api/scripts?id=${id}`, { method: 'DELETE' }));
  },

  async updateScriptStatus(authFetch: AuthFetch, id: string, status: string) {
    await ensureOk(await authFetch(`/api/scripts?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }));
  },

  async createThumbnail(authFetch: AuthFetch, payload: Record<string, unknown>) {
    await ensureOk(await authFetch('/api/thumbnails', {
      method: 'POST',
      body: JSON.stringify(payload),
    }));
  },
};
