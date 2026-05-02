import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import type { WeeklyStatus, YoutubeReconcileWeekly } from '@/app/content/dashboardTypes';
import type { getDashboardCopy } from '@/app/content/dashboard';
import type { Production } from '@/app/components/ProductionsList';
import { useDashboardPublishActions } from '@/app/hooks/dashboardActions/useDashboardPublishActions';
import { useDashboardPlanningActions } from '@/app/hooks/dashboardActions/useDashboardPlanningActions';
import { useDashboardChannelActions } from '@/app/hooks/dashboardActions/useDashboardChannelActions';
import type { ToastKind } from '@/app/hooks/dashboardActions/types';

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
    authFetch, addToast, dashboardCopy, fetchData,
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

  const { handleCreate, handlePublish } = useDashboardPublishActions({
    authFetch,
    addToast,
    dashboardCopy,
    fetchData,
    newTitle,
    publishTarget,
    publishMissing,
    publishUrl,
    publishPlatformId,
    setNewTitle,
    setShowModal,
    setPublishTarget,
    setPublishUrl,
    setPublishPlatformId,
    setPublishPlatformTouched,
    setPublishSubmitting,
  });

  const { handleGeneratePlan, handleQuickPublish, handleRegisterFromYoutube, handleSchedule, handleUnschedule } = useDashboardPlanningActions({
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
  });

  const { handleChannelChange } = useDashboardChannelActions({
    setSelectedChannelId,
    searchParamsKey,
    searchParams,
    router,
  });

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
