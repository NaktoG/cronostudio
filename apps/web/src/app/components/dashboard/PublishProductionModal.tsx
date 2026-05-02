'use client';

import { motion } from 'framer-motion';
import type { RefObject } from 'react';

import type { Production } from '@/app/components/ProductionsList';
import type { getDashboardCopy } from '@/app/content/dashboard';

interface PublishProductionModalProps {
  publishTarget: Production | null;
  dashboardCopy: ReturnType<typeof getDashboardCopy>;
  publishRef: RefObject<HTMLDivElement | null>;
  publishMissing: string[];
  publishUrl: string;
  publishPlatformId: string;
  publishSubmitting: boolean;
  onClose: () => void;
  onPublish: () => void;
  onChangeUrl: (value: string) => void;
  onChangePlatformId: (value: string) => void;
  onPlatformIdBlur: () => void;
}

export default function PublishProductionModal({
  publishTarget,
  dashboardCopy,
  publishRef,
  publishMissing,
  publishUrl,
  publishPlatformId,
  publishSubmitting,
  onClose,
  onPublish,
  onChangeUrl,
  onChangePlatformId,
  onPlatformIdBlur,
}: PublishProductionModalProps) {
  if (!publishTarget) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-modal-title"
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 sm:p-8 w-full max-w-lg"
        ref={publishRef}
        tabIndex={-1}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="publish-modal-title" className="text-2xl font-semibold text-white mb-3">{dashboardCopy.publishModal.title}</h3>
        <p className="text-sm text-slate-300 mb-5">{publishTarget.title}</p>
        <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-xs text-yellow-200">
          {dashboardCopy.publishModal.helper}
        </div>
        {publishMissing.length > 0 && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            {dashboardCopy.publishModal.missingSteps}: {publishMissing.join(', ')}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{dashboardCopy.publishModal.publishedUrlLabel}</label>
            <input
              type="url"
              value={publishUrl}
              onChange={(event) => onChangeUrl(event.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
              placeholder={dashboardCopy.publishModal.publishedUrlPlaceholder}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{dashboardCopy.publishModal.platformIdLabel}</label>
            <input
              type="text"
              value={publishPlatformId}
              onChange={(event) => onChangePlatformId(event.target.value)}
              onBlur={onPlatformIdBlur}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
              placeholder="YouTube videoId"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <motion.button
              onClick={onClose}
              className="flex-1 px-5 py-3 text-base border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={publishSubmitting}
            >
              {dashboardCopy.publishModal.cancel}
            </motion.button>
            <motion.button
              onClick={onPublish}
              className="flex-1 px-5 py-3 text-base bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={publishSubmitting || publishMissing.length > 0}
            >
              {publishSubmitting ? dashboardCopy.labels.saving : dashboardCopy.publishModal.confirm}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
