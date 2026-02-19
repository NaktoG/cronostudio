import type { CalendarItem, CalendarResponse } from '@/domain/types/calendar';
import type { AuthFetch } from '@/services/types';
import { ServiceError } from '@/services/types';

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  return data as T;
}

export const calendarService = {
  async list(authFetch: AuthFetch, from: string, to: string): Promise<CalendarItem[]> {
    const response = await authFetch(`/api/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    if (!response.ok) {
      throw new ServiceError('Error al obtener calendario', response.status);
    }
    const data = await parseJson<CalendarResponse>(response);
    return Array.isArray(data.items) ? data.items : [];
  },
};
