'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import type { AutomationRun } from '@/app/components/AutomationRuns';
import { getDashboardCopy } from '@/app/content/dashboard';
import { useLocale } from '@/app/contexts/LocaleContext';

interface AutomationRunsPanelProps {
  runs: AutomationRun[];
}

export default function AutomationRunsPanel({ runs }: AutomationRunsPanelProps) {
  const { locale } = useLocale();
  const copy = getDashboardCopy(locale);

  if (runs.length === 0) {
    return (
      <motion.div
        className="surface-card glow-hover p-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-sm text-slate-400">{copy.cards.noRuns}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="surface-card glow-hover p-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400/90 mb-4">
        {copy.cards.automationRuns}
      </h2>
      <div className="space-y-3">
        <AnimatePresence>
          {runs.slice(0, 5).map((run, index) => (
            <motion.div
              key={run.id}
              className="p-3 rounded-lg border border-gray-800 bg-gray-900/40"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">{run.workflow}</span>
                <span className={`text-xs px-2 py-1 rounded ${run.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {run.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(run.created_at).toLocaleString()}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
