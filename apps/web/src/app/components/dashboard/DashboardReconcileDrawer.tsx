'use client';

import type { getDashboardCopy } from '@/app/content/dashboard';

interface DrawerEvidence {
  matched: boolean;
  video: { videoId: string; title: string; publishedAt: string; url: string } | null;
}

interface DrawerPublish {
  matched: boolean;
  eventId: string | null;
  publishedAt: string | null;
}

interface DashboardReconcileDrawerProps {
  open: boolean;
  reduceMotion: boolean;
  dashboardCopy: ReturnType<typeof getDashboardCopy>;
  drawerLabel: string;
  drawerEvidence: DrawerEvidence | null | undefined;
  drawerPublish: DrawerPublish | null | undefined;
  drawerHasAction: boolean;
  drawerSlot: 'tue' | 'fri' | null;
  reconcileSubmitting: boolean;
  quickPublishSubmitting: boolean;
  onClose: () => void;
  onRegisterFromYoutube: (slot: 'tue' | 'fri') => void;
  onQuickPublish: (day: 'tuesday' | 'friday') => void;
}

export default function DashboardReconcileDrawer({
  open,
  reduceMotion,
  dashboardCopy,
  drawerLabel,
  drawerEvidence,
  drawerPublish,
  drawerHasAction,
  drawerSlot,
  reconcileSubmitting,
  quickPublishSubmitting,
  onClose,
  onRegisterFromYoutube,
  onQuickPublish,
}: DashboardReconcileDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={`absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-gray-800 bg-gray-950 p-6 lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:max-h-none lg:w-[min(92vw,420px)] lg:rounded-none lg:border-l ${
          reduceMotion ? '' : 'transition-transform duration-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/90">{dashboardCopy.drawer.weeklyDetail}</div>
            <h3 className="mt-2 text-lg font-semibold text-white">{drawerLabel}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400"
          >
            {dashboardCopy.drawer.close}
          </button>
        </div>
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">{dashboardCopy.drawer.youtube}</div>
            {drawerEvidence?.matched ? (
              <div className="mt-2 space-y-1 text-sm text-white">
                <p className="font-medium">{drawerEvidence.video?.title}</p>
                <p className="text-xs text-slate-400">{drawerEvidence.video?.publishedAt}</p>
                <a
                  href={drawerEvidence.video?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-yellow-300"
                >
                  {dashboardCopy.drawer.openInYoutube}
                </a>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400">{dashboardCopy.drawer.noEvidence}</p>
            )}
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">{dashboardCopy.drawer.publishEvent}</div>
            {drawerPublish?.matched ? (
              <p className="mt-2 text-sm text-white">{dashboardCopy.drawer.registered} · {drawerPublish.publishedAt}</p>
            ) : (
              <p className="mt-2 text-xs text-slate-400">{dashboardCopy.drawer.noInternalRecord}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {drawerHasAction && drawerSlot && (
              <button
                type="button"
                onClick={() => onRegisterFromYoutube(drawerSlot)}
                disabled={reconcileSubmitting}
                className="rounded-lg bg-amber-400 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black"
              >
                {dashboardCopy.drawer.registerOneClick}
              </button>
            )}
            {drawerSlot && (
              <button
                type="button"
                onClick={() => onQuickPublish(drawerSlot === 'tue' ? 'tuesday' : 'friday')}
                disabled={quickPublishSubmitting}
                className="rounded-lg border border-gray-800 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
              >
                {dashboardCopy.drawer.registerManual}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
