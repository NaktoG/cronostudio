'use client';

import { motion } from 'framer-motion';
import type { RefObject } from 'react';

import type { getDashboardCopy } from '@/app/content/dashboard';

interface CreateProductionModalProps {
  open: boolean;
  dashboardCopy: ReturnType<typeof getDashboardCopy>;
  newTitle: string;
  modalRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onChangeTitle: (value: string) => void;
  onCreate: () => void;
}

export default function CreateProductionModal({
  open,
  dashboardCopy,
  newTitle,
  modalRef,
  onClose,
  onChangeTitle,
  onCreate,
}: CreateProductionModalProps) {
  if (!open) return null;

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
        aria-labelledby="dashboard-modal-title"
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 sm:p-8 w-full max-w-lg max-h-[85dvh] overflow-y-auto"
        ref={modalRef}
        tabIndex={-1}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="dashboard-modal-title" className="text-2xl font-semibold text-white mb-5">{dashboardCopy.modal.title}</h3>
        <input
          type="text"
          value={newTitle}
          onChange={(event) => onChangeTitle(event.target.value)}
          placeholder={dashboardCopy.modal.placeholder}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-5 py-4 text-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none mb-5"
          autoFocus
          onKeyDown={(event) => event.key === 'Enter' && onCreate()}
        />
        <div className="flex flex-col gap-4 sm:flex-row">
          <motion.button
            onClick={onClose}
            className="flex-1 px-5 py-3 text-base border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {dashboardCopy.modal.cancel}
          </motion.button>
          <motion.button
            onClick={onCreate}
            className="flex-1 px-5 py-3 text-base bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {dashboardCopy.modal.create}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
