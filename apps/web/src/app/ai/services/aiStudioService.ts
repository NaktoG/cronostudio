import type { Channel, IdeaOption, Profile, Run, ScriptOption } from '@/app/ai/types';

type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function parseArray<T>(response: Response, key?: string): Promise<T[]> {
  const data = await parseJson<unknown>(response);
  if (Array.isArray(data)) {
    return data as T[];
  }
  if (key && data && typeof data === 'object') {
    const value = (data as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      return value as T[];
    }
  }
  return [];
}

async function ensureOk(response: Response): Promise<Response> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = (data as { error?: string }).error || 'Solicitud fallida';
    throw new Error(message);
  }
  return response;
}

export const aiStudioService = {
  async fetchProfiles(authFetch: AuthFetch): Promise<Profile[]> {
    const response = await authFetch('/api/ai/profiles');
    if (!response.ok) return [];
    const data = await parseJson<{ profiles?: Profile[] }>(response);
    return data.profiles ?? [];
  },

  async fetchChannels(authFetch: AuthFetch): Promise<Channel[]> {
    const response = await authFetch('/api/channels');
    if (!response.ok) return [];
    return await parseArray<Channel>(response);
  },

  async fetchRuns(authFetch: AuthFetch, channelId: string, limit = 20): Promise<Run[]> {
    const response = await authFetch(`/api/ai/runs?channelId=${channelId}&limit=${limit}`);
    if (!response.ok) return [];
    return await parseArray<Run>(response, 'runs');
  },

  async fetchIdeaOptions(authFetch: AuthFetch, channelId: string): Promise<IdeaOption[]> {
    const response = await authFetch(`/api/ideas?channelId=${channelId}`);
    if (!response.ok) return [];
    return await parseArray<IdeaOption>(response);
  },

  async fetchScriptOptions(authFetch: AuthFetch, channelId: string): Promise<ScriptOption[]> {
    const response = await authFetch(`/api/scripts?channelId=${channelId}`);
    if (!response.ok) return [];
    return await parseArray<ScriptOption>(response);
  },

  async createRun(authFetch: AuthFetch, payload: Record<string, unknown>): Promise<{ runId: string; prompt: { system: string; user: string } }> {
    const response = await ensureOk(await authFetch('/api/ai/runs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }));
    return await parseJson(response);
  },

  async executeRun(authFetch: AuthFetch, payload: Record<string, unknown>): Promise<{ runId: string; output: unknown; applied?: Record<string, unknown> }> {
    const response = await ensureOk(await authFetch('/api/ai/runs/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    }));
    return await parseJson(response);
  },

  async submitRunOutput(authFetch: AuthFetch, runId: string, outputJson: unknown): Promise<void> {
    await ensureOk(await authFetch(`/api/ai/runs/${runId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ outputJson }),
    }));
  },

  async applyRun(authFetch: AuthFetch, runId: string): Promise<{ applied?: Record<string, unknown> }> {
    const response = await ensureOk(await authFetch(`/api/ai/runs/${runId}/apply`, {
      method: 'POST',
    }));
    return await parseJson(response);
  },
};
