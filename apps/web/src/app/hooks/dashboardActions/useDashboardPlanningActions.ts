import { useCallback } from 'react';

import type { WeeklyStatus, YoutubeReconcileWeekly } from '@/app/content/dashboardTypes';
import type { CommonActionDeps } from '@/app/hooks/dashboardActions/types';

interface UseDashboardPlanningActionsParams extends CommonActionDeps {
  selectedChannelId: string;
  weeklyStatus: WeeklyStatus | null;
  fallbackIso: { isoYear: number; isoWeek: number };
  reconcileWeekly: YoutubeReconcileWeekly | null;
  setPlanSubmitting: (value: boolean) => void;
  setQuickPublishSubmitting: (value: boolean) => void;
  setReconcileSubmitting: (value: boolean) => void;
  setScheduleProductionId: (value: string) => void;
  setScheduleDate: (value: string) => void;
}

export function useDashboardPlanningActions(params: UseDashboardPlanningActionsParams) {
  const {
    authFetch,
    addToast,
    dashboardCopy,
    fetchData,
    selectedChannelId,
    weeklyStatus,
    fallbackIso,
    reconcileWeekly,
    setPlanSubmitting,
    setQuickPublishSubmitting,
    setReconcileSubmitting,
    setScheduleProductionId,
    setScheduleDate,
  } = params;

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
    handleGeneratePlan,
    handleQuickPublish,
    handleRegisterFromYoutube,
    handleSchedule,
    handleUnschedule,
  };
}
