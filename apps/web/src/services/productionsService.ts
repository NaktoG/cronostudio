import type { PipelineStats, Production } from '@/domain/types';
import type { AuthFetch } from '@/services/types';
import { ServiceError } from '@/services/types';

export type ProductionsResponse = {
  productions: Production[];
  pipeline?: PipelineStats;
};

export const productionsService = {
  async list(authFetch: AuthFetch, withStats: boolean): Promise<ProductionsResponse> {
    const response = await authFetch(`/api/productions?stats=${withStats ? 'true' : 'false'}`);
    if (!response.ok) {
      throw new ServiceError('Error al obtener contenidos', response.status);
    }
    return response.json() as Promise<ProductionsResponse>;
  },

  async create(authFetch: AuthFetch, title: string): Promise<Production> {
    const response = await authFetch('/api/productions', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    if (!response.ok) {
      throw new ServiceError('Error al crear contenido', response.status);
    }
    return response.json() as Promise<Production>;
  },
  async getById(authFetch: AuthFetch, id: string): Promise<Production> {
    const response = await authFetch(`/api/productions/${id}`);
    if (!response.ok) {
      throw new ServiceError('Error al obtener contenido', response.status);
    }
    return response.json() as Promise<Production>;
  },
};
