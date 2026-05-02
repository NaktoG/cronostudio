import { useCallback } from 'react';

import type { Production } from '@/app/components/ProductionsList';
import type { CommonActionDeps } from '@/app/hooks/dashboardActions/types';

interface UseDashboardPublishActionsParams extends CommonActionDeps {
  newTitle: string;
  publishTarget: Production | null;
  publishMissing: string[];
  publishUrl: string;
  publishPlatformId: string;
  setNewTitle: (value: string) => void;
  setShowModal: (value: boolean) => void;
  setPublishTarget: (value: Production | null) => void;
  setPublishUrl: (value: string) => void;
  setPublishPlatformId: (value: string) => void;
  setPublishPlatformTouched: (value: boolean) => void;
  setPublishSubmitting: (value: boolean) => void;
}

export function useDashboardPublishActions(params: UseDashboardPublishActionsParams) {
  const {
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

  return { handleCreate, handlePublish };
}
