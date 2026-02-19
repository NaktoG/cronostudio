import { useCallback, useState } from 'react';
import type { CalendarItem } from '@/domain/types/calendar';
import { calendarService } from '@/services/calendarService';
import type { AuthFetch } from '@/services/types';

export type UseCalendarState = {
  items: CalendarItem[];
  loading: boolean;
  error: string | null;
};

export function useCalendar(authFetch: AuthFetch, isAuthenticated: boolean) {
  const [state, setState] = useState<UseCalendarState>({
    items: [],
    loading: true,
    error: null,
  });

  const fetchCalendar = useCallback(
    async (from: string, to: string) => {
      if (!isAuthenticated) {
        setState({ items: [], loading: false, error: null });
        return;
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const items = await calendarService.list(authFetch, from, to);
        setState({ items, loading: false, error: null });
      } catch (error) {
        setState({ items: [], loading: false, error: error instanceof Error ? error.message : 'Error' });
      }
    },
    [authFetch, isAuthenticated]
  );

  return {
    ...state,
    fetchCalendar,
  };
}
