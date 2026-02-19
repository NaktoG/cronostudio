import type { Idea, IdeaFormData, IdeaUpdatePayload } from '@/domain/types';
import type { AuthFetch } from '@/services/types';
import { ServiceError } from '@/services/types';

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  return data as T;
}

export const ideasService = {
  async list(authFetch: AuthFetch): Promise<Idea[]> {
    const response = await authFetch('/api/ideas');
    if (!response.ok) {
      throw new ServiceError('Error al obtener ideas', response.status);
    }
    return parseJson<Idea[]>(response);
  },

  async create(authFetch: AuthFetch, payload: IdeaFormData): Promise<Idea> {
    const response = await authFetch('/api/ideas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new ServiceError(data.error || 'Error al crear idea', response.status);
    }
    return parseJson<Idea>(response);
  },

  async update(authFetch: AuthFetch, id: string, payload: IdeaUpdatePayload): Promise<Idea> {
    const response = await authFetch(`/api/ideas?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new ServiceError(data.error || 'Error al actualizar idea', response.status);
    }
    return parseJson<Idea>(response);
  },

  async remove(authFetch: AuthFetch, id: string): Promise<void> {
    const response = await authFetch(`/api/ideas?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const data = await response.json();
      throw new ServiceError(data.error || 'Error al eliminar idea', response.status);
    }
  },
};
