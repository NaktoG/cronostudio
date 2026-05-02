import { useCallback, useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import type { AutomationRun } from '@/app/components/AutomationRuns';
import type { Production } from '@/app/components/ProductionsList';
import type {
  Channel,
  DisciplineWeekly,
  PipelineStats,
  PriorityAction,
  WeeklyGoalResponse,
  WeeklyStatus,
  YoutubeReconcileWeekly,
} from '@/app/content/dashboardTypes';

type ToastKind = 'success' | 'error' | 'warning';

interface UseDashboardDataLoaderParams {
  isAuthenticated: boolean;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  selectedChannelId: string;
  setSelectedChannelId: (value: string) => void;
  searchParamsKey: string;
  router: AppRouterInstance;
  fallbackIso: { isoYear: number; isoWeek: number };
  logout: () => void;
  addToast: (message: string, kind?: ToastKind) => void;
  toasts: { sessionExpired: string; weeklyStatusError: string };
  setChannels: (value: Channel[]) => void;
  setProductions: (value: Production[]) => void;
  setPipelineStats: (value: PipelineStats) => void;
  setIdeas: (value: Array<{ id: string; title: string; status: string; priority: number }>) => void;
  setRuns: (value: AutomationRun[]) => void;
  setWeeklyStatus: (value: WeeklyStatus | null) => void;
  setWeeklyActions: (value: PriorityAction[]) => void;
  setWeeklyError: (value: string | null) => void;
  setWeeklyGoal: (value: WeeklyGoalResponse | null) => void;
  setDisciplineWeekly: (value: DisciplineWeekly | null) => void;
  setReconcileWeekly: (value: YoutubeReconcileWeekly | null) => void;
  setReconcileError: (value: string | null) => void;
  setLoading: (value: boolean) => void;
  autoFetchKeyRef: MutableRefObject<string>;
}

export function useDashboardDataLoader(params: UseDashboardDataLoaderParams) {
  const {
    isAuthenticated,
    authFetch,
    selectedChannelId,
    setSelectedChannelId,
    searchParamsKey,
    router,
    fallbackIso,
    logout,
    addToast,
    toasts,
    setChannels,
    setProductions,
    setPipelineStats,
    setIdeas,
    setRuns,
    setWeeklyStatus,
    setWeeklyActions,
    setWeeklyError,
    setWeeklyGoal,
    setDisciplineWeekly,
    setReconcileWeekly,
    setReconcileError,
    setLoading,
    autoFetchKeyRef,
  } = params;

  const fetchChannels = useCallback(async (signal?: AbortSignal) => {
    try {
      if (!isAuthenticated) {
        setChannels([]);
        return;
      }
      const response = await authFetch('/api/channels', { signal });
      if (!response.ok) return;
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setChannels(list);
      if (list.length === 0) {
        setSelectedChannelId('');
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('cronostudio.channelId');
        }
        return;
      }

      const hasSelected = selectedChannelId
        ? list.some((channel: { id: string }) => channel.id === selectedChannelId)
        : false;
      if (!selectedChannelId || !hasSelected) {
        const defaultId = list[0].id;
        setSelectedChannelId(defaultId);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('cronostudio.channelId', defaultId);
        }
        const routeParams = new URLSearchParams(searchParamsKey);
        routeParams.set('channelId', defaultId);
        const query = routeParams.toString();
        router.replace(query ? `/?${query}` : '/');
      }
    } catch {
      if (signal?.aborted) return;
      setChannels([]);
    }
  }, [isAuthenticated, authFetch, setChannels, selectedChannelId, setSelectedChannelId, searchParamsKey, router]);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      const isoYear = fallbackIso.isoYear;
      const isoWeek = fallbackIso.isoWeek;
      const resolvedChannelId = selectedChannelId || '';

      const queryParams = new URLSearchParams({ isoYear: String(isoYear), isoWeek: String(isoWeek) });
      if (resolvedChannelId) queryParams.set('channelId', resolvedChannelId);
      const query = `?${queryParams.toString()}`;

      const weeklyRequests = resolvedChannelId
        ? [
            authFetch(`/api/weekly-status${query}`, { signal }),
            authFetch(`/api/weekly-goals${query}`, { signal }),
            authFetch(`/api/discipline/weekly${query}`, { signal }),
          ]
        : [
            Promise.resolve(new Response(null, { status: 204 })),
            Promise.resolve(new Response(null, { status: 204 })),
            Promise.resolve(new Response(null, { status: 204 })),
          ];

      const [productionsRes, ideasRes, runsRes, weeklyRes, weeklyGoalsRes, disciplineRes] = await Promise.all([
        authFetch('/api/productions?stats=true', { signal }),
        authFetch('/api/ideas', { signal }),
        authFetch('/api/automation-runs', { signal }),
        ...weeklyRequests,
      ]);

      const responses = [productionsRes, ideasRes, runsRes, weeklyRes, weeklyGoalsRes, disciplineRes];
      if (responses.some((res) => res.status === 401)) {
        logout();
        addToast(toasts.sessionExpired, 'error');
        return;
      }

      if (productionsRes.ok) {
        const data = await productionsRes.json();
        setProductions(data.productions || []);
        if (data.pipeline) {
          setPipelineStats({
            idea: data.pipeline.idea || 0,
            scripting: data.pipeline.scripting || 0,
            recording: data.pipeline.recording || 0,
            editing: data.pipeline.editing || 0,
            shorts: data.pipeline.shorts || 0,
            publishing: data.pipeline.publishing || 0,
            published: data.pipeline.published || 0,
          });
        }
      }

      if (ideasRes.ok) {
        const ideasData = await ideasRes.json();
        const ideasList = Array.isArray(ideasData) ? ideasData : [];
        setIdeas(ideasList.map((idea: { id: string; title: string; status: string; priority: number }) => idea));
      }

      if (runsRes.ok) {
        const runsData = await runsRes.json();
        setRuns(Array.isArray(runsData) ? runsData : []);
      } else {
        setRuns([]);
      }

      if (weeklyRes.ok && weeklyRes.status !== 204) {
        const weeklyData: WeeklyStatus = await weeklyRes.json();
        setWeeklyStatus(weeklyData);
        setWeeklyActions(Array.isArray(weeklyData.tasks) ? weeklyData.tasks : []);
        setWeeklyError(null);
      } else if (weeklyRes.ok) {
        setWeeklyStatus(null);
        setWeeklyActions([]);
        setWeeklyError(null);
      } else {
        const errorData = await weeklyRes.json().catch(() => null);
        setWeeklyError(errorData?.error || toasts.weeklyStatusError);
        setWeeklyStatus(null);
        setWeeklyActions([]);
      }

      if (weeklyGoalsRes.ok && weeklyGoalsRes.status !== 204) {
        const goalsData: WeeklyGoalResponse = await weeklyGoalsRes.json();
        setWeeklyGoal(goalsData);
      } else {
        setWeeklyGoal(null);
      }

      if (disciplineRes.ok && disciplineRes.status !== 204) {
        const disciplineData: DisciplineWeekly = await disciplineRes.json();
        setDisciplineWeekly(disciplineData);
      } else {
        setDisciplineWeekly(null);
      }

      if (resolvedChannelId) {
        authFetch(`/api/integrations/youtube/reconcile/weekly${query}`, { signal })
          .then(async (reconcileRes) => {
            if (signal?.aborted) return;
            if (reconcileRes.ok && reconcileRes.status !== 204) {
              const reconcileData: YoutubeReconcileWeekly = await reconcileRes.json();
              setReconcileWeekly(reconcileData);
              setReconcileError(null);
              return;
            }

            setReconcileWeekly(null);
            if (reconcileRes.status !== 204) {
              const errorData = await reconcileRes.json().catch(() => null);
              if (reconcileRes.status === 401 && errorData?.error === 'youtube_auth_invalid') {
                setReconcileError(errorData.error);
                return;
              }
              if (reconcileRes.status === 401) {
                logout();
                addToast(toasts.sessionExpired, 'error');
                return;
              }
              setReconcileError(errorData?.error || 'youtube_error');
            } else {
              setReconcileError(null);
            }
          })
          .catch(() => {
            if (signal?.aborted) return;
            setReconcileWeekly(null);
            setReconcileError('youtube_error');
          });
      }
    } catch (error) {
      if (signal?.aborted) return;
      console.error('[dashboard] request failed', error);
    } finally {
      setLoading(false);
    }
  }, [authFetch, selectedChannelId, fallbackIso.isoYear, fallbackIso.isoWeek, logout, addToast, toasts.sessionExpired, toasts.weeklyStatusError, setProductions, setPipelineStats, setIdeas, setRuns, setWeeklyStatus, setWeeklyActions, setWeeklyError, setWeeklyGoal, setDisciplineWeekly, setReconcileWeekly, setReconcileError, setLoading]);

  useEffect(() => {
    if (!isAuthenticated) {
      autoFetchKeyRef.current = '';
      setLoading(false);
      return;
    }

    const autoFetchKey = `${selectedChannelId || 'none'}:${fallbackIso.isoYear}:${fallbackIso.isoWeek}`;
    if (autoFetchKeyRef.current === autoFetchKey) return;
    autoFetchKeyRef.current = autoFetchKey;

    const controller = new AbortController();
    fetchChannels(controller.signal);
    fetchData(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated, selectedChannelId, fallbackIso.isoYear, fallbackIso.isoWeek, fetchChannels, fetchData, autoFetchKeyRef, setLoading]);

  return { fetchData };
}
