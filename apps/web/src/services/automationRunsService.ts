import type { AutomationRun } from '@/domain/types';
import type { AuthFetch } from '@/services/types';
import { ServiceError } from '@/services/types';

export const automationRunsService = {
  async list(authFetch: AuthFetch): Promise<AutomationRun[]> {
    const response = await authFetch('/api/automation-runs');
    if (!response.ok) {
      throw new ServiceError('Error al obtener ejecuciones', response.status);
    }
    return response.json() as Promise<AutomationRun[]>;
  },
};
