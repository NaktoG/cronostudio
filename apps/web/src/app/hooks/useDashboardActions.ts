import { useCallback } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import type { WeeklyStatus, YoutubeReconcileWeekly } from '@/app/content/dashboardTypes';
import type { getDashboardCopy } from '@/app/content/dashboard';
import type { Production } from '@/app/components/ProductionsList';

type ToastKind = 'success' | 'error' | 'warning';

interface UseDashboardActionsParams {
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  addToast: (message: string, kind?: ToastKind) => void;
  dashboardCopy: ReturnType<typeof getDashboardCopy>;
  fetchData: () => void;
  selectedChannelId: string;
  weeklyStatus: WeeklyStatus | null;
  fallbackIso: { isoYear: number; isoWeek: number };
  reconcileWeekly: YoutubeReconcileWeekly | null;
  searchParamsKey: string;
  searchParams: URLSearchParams | null;
  router: AppRouterInstance;
  newTitle: string;
  publishTarget: Production | null;
  publishMissing: string[];
  publishUrl: string;
  publishPlatformId: string;
  setSelectedChannelId: (value: string) => void;
  setNewTitle: (value: string) => void;
  setShowModal: (value: boolean) => void;
  setPublishTarget: (value: Production | null) => void;
  setPublishUrl: (value: string) => void;
  setPublishPlatformId: (value: string) => void;
  setPublishPlatformTouched: (value: boolean) => void;
  setPublishSubmitting: (value: boolean) => void;
  setPlanSubmitting: (value: boolean) => void;
  setQuickPublishSubmitting: (value: boolean) => void;
  setReconcileSubmitting: (value: boolean) => void;
  setScheduleProductionId: (value: string) => void;
  setScheduleDate: (value: string) => void;
}

export function extractYouTubeId(value: string) {
  if (!value) return '';
  try {
    const url = new URL(value);
    const id = url.searchParams.get('v');
    if (id) return id;
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace('/', '').trim();
    }
    return '';
  } catch {
    return '';
  }
}

export function useDashboardActions(params: UseDashboardActionsParams) {
  const {
    authFetch,
    addToast,
    dashboardCopy,
    fetchData,
    selectedChannelId,
    weeklyStatus,
    fallbackIso,
    reconcileWeekly,
    searchParamsKey,
    searchParams,
    router,
    newTitle,
    publishTarget,
    publishMissing,
    publishUrl,
    publishPlatformId,
    setSelectedChannelId,
    setNewTitle,
    setShowModal,
    setPublishTarget,
    setPublishUrl,
    setPublishPlatformId,
    setPublishPlatformTouched,
    setPublishSubmitting,
    setPlanSubmitting,
    setQuickPublishSubmitting,
    setReconcileSubmitting,
    setScheduleProductionId,
    setScheduleDate,
  } = params;

  const handleCreate = useCallback(async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await authFetch('/api/productions', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setNewTitle('');
        setShowModal(false);
        fetchData();
        addToast(dashboardCopy.toasts.created, 'success');
      } else {
        addToast(dashboardCopy.toasts.createFailed, 'error');
      }
    } catch (error) {
      addToast(dashboardCopy.toasts.createError, 'error');
      console.error('[dashboard] update failed', error);
    }
  }, [newTitle, authFetch, setNewTitle, setShowModal, fetchData, addToast, dashboardCopy.toasts]);

  const handlePublish = useCallback(async () => {
    if (!publishTarget) return;
    if (publishMissing.length > 0) {
      addToast(`Completa: ${publishMissing.join(', ')}`, 'error');
      return;
    }
    setPublishSubmitting(true);
    try {
      const response = await authFetch('/api/productions/publish', {
        method: 'POST',
        body: JSON.stringify({
          productionId: publishTarget.id,
          publishedUrl: publishUrl.trim() || null,
          platformId: publishPlatformId.trim() || null,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || dashboardCopy.toasts.publishMarkError);
      }
      setPublishTarget(null);
      setPublishUrl('');
      setPublishPlatformId('');
      setPublishPlatformTouched(false);
      fetchData();
      addToast(dashboardCopy.toasts.publishMarked, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : dashboardCopy.toasts.publishMarkError, 'error');
    } finally {
      setPublishSubmitting(false);
    }
  }, [publishTarget, publishMissing, addToast, setPublishSubmitting, authFetch, publishUrl, publishPlatformId, dashboardCopy.toasts, setPublishTarget, setPublishUrl, setPublishPlatformId, setPublishPlatformTouched, fetchData]);

  const handleGeneratePlan = useCallback(async () => {
    if (!selectedChannelId) {
      addToast(dashboardCopy.toasts.selectChannelFirst, 'error');
      return;
    }
    setPlanSubmitting(true);
    try {
      const isoYear = weeklyStatus?.week.isoYear ?? fallbackIso.isoYear;
      const isoWeek = weeklyStatus?.week.isoWeek ?? fallbackIso.isoWeek;
      const routeParams = new URLSearchParams({ channelId: selectedChannelId, isoYear: String(isoYear), isoWeek: String(isoWeek) });
      const response = await authFetch(`/api/weekly-plan/generate?${routeParams.toString()}`, { method: 'POST' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || dashboardCopy.toasts.generatePlanError);
      }
      addToast(dashboardCopy.toasts.planGenerated, 'success');
      fetchData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : dashboardCopy.toasts.generatePlanError, 'error');
    } finally {
      setPlanSubmitting(false);
    }
  }, [selectedChannelId, addToast, dashboardCopy.toasts, setPlanSubmitting, weeklyStatus?.week.isoYear, weeklyStatus?.week.isoWeek, fallbackIso.isoYear, fallbackIso.isoWeek, authFetch, fetchData]);

  const handleChannelChange = useCallback((value: string) => {
    setSelectedChannelId(value);
    if (typeof window !== 'undefined') {
      if (value) window.localStorage.setItem('cronostudio.channelId', value);
      else window.localStorage.removeItem('cronostudio.channelId');
    }
    const routeParams = new URLSearchParams(searchParams?.toString() ?? searchParamsKey);
    if (value) routeParams.set('channelId', value);
    else routeParams.delete('channelId');
    const query = routeParams.toString();
    router.replace(query ? `/?${query}` : '/');
  }, [setSelectedChannelId, searchParams, searchParamsKey, router]);

  const handleQuickPublish = useCallback(async (targetDay: 'tuesday' | 'friday') => {
    if (!selectedChannelId) {
      addToast(dashboardCopy.toasts.selectChannelFirst, 'error');
      return;
    }
    setQuickPublishSubmitting(true);
    try {
      const response = await authFetch('/api/discipline/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: selectedChannelId, targetDay }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || dashboardCopy.toasts.registerPublishError);
      }
      addToast(dashboardCopy.toasts.scheduled, 'success');
      fetchData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : dashboardCopy.toasts.registerPublishError, 'error');
    } finally {
      setQuickPublishSubmitting(false);
    }
  }, [selectedChannelId, addToast, dashboardCopy.toasts, setQuickPublishSubmitting, authFetch, fetchData]);

  const handleRegisterFromYoutube = useCallback(async (slot: 'tue' | 'fri') => {
    if (!selectedChannelId || !reconcileWeekly) {
      addToast(dashboardCopy.toasts.selectChannelFirst, 'error');
      return;
    }
    const action = reconcileWeekly.suggestedActions.find((item) => item.slot === slot);
    if (!action) return;

    setReconcileSubmitting(true);
    try {
      const response = await authFetch('/api/discipline/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || dashboardCopy.toasts.registerPublishError);
      }
      addToast(dashboardCopy.toasts.registerFromYoutubeSuccess, 'success');
      fetchData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : dashboardCopy.toasts.registerPublishError, 'error');
    } finally {
      setReconcileSubmitting(false);
    }
  }, [selectedChannelId, reconcileWeekly, addToast, dashboardCopy.toasts, setReconcileSubmitting, authFetch, fetchData]);

  const handleSchedule = useCallback(async (scheduleProductionId: string, scheduleDate: string) => {
    if (!scheduleProductionId || !scheduleDate) return;
    try {
      const response = await authFetch(`/api/productions?id=${scheduleProductionId}`, {
        method: 'PUT',
        body: JSON.stringify({ targetDate: scheduleDate }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || dashboardCopy.toasts.scheduleError);
      }
      addToast(dashboardCopy.toasts.scheduled, 'success');
      setScheduleProductionId('');
      setScheduleDate('');
      fetchData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : dashboardCopy.toasts.scheduleError, 'error');
    }
  }, [authFetch, dashboardCopy.toasts, addToast, setScheduleProductionId, setScheduleDate, fetchData]);

  const handleUnschedule = useCallback(async (productionId: string) => {
    try {
      const response = await authFetch(`/api/productions?id=${productionId}`, {
        method: 'PUT',
        body: JSON.stringify({ targetDate: null }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || dashboardCopy.toasts.cancelError);
      }
      addToast(dashboardCopy.toasts.canceled, 'success');
      fetchData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : dashboardCopy.toasts.cancelError, 'error');
    }
  }, [authFetch, dashboardCopy.toasts, addToast, fetchData]);

  return {
    handleCreate,
    handlePublish,
    handleGeneratePlan,
    handleChannelChange,
    handleQuickPublish,
    handleRegisterFromYoutube,
    handleSchedule,
    handleUnschedule,
  };
}
