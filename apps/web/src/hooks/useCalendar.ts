import { useCallback, useEffect, useRef, useState } from 'react';
import type { CalendarItem } from '@/domain/types/calendar';
import { calendarService } from '@/services/calendarService';
import type { AuthFetch } from '@/services/types';
import { ServiceError } from '@/services/types';

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
  const authFetchRef = useRef(authFetch);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const inFlightRef = useRef(false);
  const lastRequestedRef = useRef<string | null>(null);
  const lastCompletedRef = useRef<string | null>(null);

  useEffect(() => {
    authFetchRef.current = authFetch;
  }, [authFetch]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const fetchCalendar = useCallback(async (from: string, to: string) => {
    const requestKey = `${from}:${to}`;

    if (!isAuthenticatedRef.current) {
      setState({ items: [], loading: false, error: null });
      return;
    }

    if (inFlightRef.current && lastRequestedRef.current === requestKey) {
      return;
    }

    if (lastCompletedRef.current === requestKey) {
      return;
    }

    inFlightRef.current = true;
    lastRequestedRef.current = requestKey;

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const items = await calendarService.list(authFetchRef.current, from, to);
      setState({ items, loading: false, error: null });
      lastCompletedRef.current = requestKey;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      setState({ items: [], loading: false, error: message });

      if (error instanceof ServiceError && (error.status === 401 || error.status === 429)) {
        lastCompletedRef.current = requestKey;
      }
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  return {
    ...state,
    fetchCalendar,
  };
}
