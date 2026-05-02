'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import type { PriorityAction } from '@/app/page';
import { getDashboardCopy } from '@/app/content/dashboard';
import { useLocale } from '@/app/contexts/LocaleContext';

const urgencyStyles: Record<PriorityAction['urgency'], string> = {
  high: 'border-red-500/30 bg-red-500/5 text-red-300',
  medium: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-300',
  low: 'border-blue-500/30 bg-blue-500/5 text-blue-300',
};

const urgencyIcons: Record<PriorityAction['urgency'], React.ComponentType> = {
  high: AlertTriangle,
  medium: Clock,
  low: CheckCircle2,
};

interface PriorityActionsPanelProps {
  actions: PriorityAction[];
}

export default function PriorityActionsPanel({ actions }: PriorityActionsPanelProps) {
  const { locale } = useLocale();
  const copy = getDashboardCopy(locale);

  if (actions.length === 0) {
    return (
      <motion.div
        className="surface-card glow-hover p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-sm text-slate-400">{copy.cards.noPriorityActions}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="surface-card glow-hover p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400/90 mb-4">
        {copy.cards.priorityActionsTitle}
      </h2>

      <div className="space-y-3">
        <AnimatePresence>
          {actions.map((action, index) => {
            const Icon = urgencyIcons[action.urgency];
            const style = urgencyStyles[action.urgency];
            const href = action.href ?? `/productions?productionId=${action.productionId}`;

            return (
              <motion.div
                key={action.id}
                className={`flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${style}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-xs opacity-80">{action.productionTitle}</p>
                  </div>
                </div>

                <a
                  href={href}
                  className="inline-flex items-center gap-1 self-end rounded-lg border border-current px-3 py-1.5 text-xs font-semibold hover:bg-current/10 sm:self-center"
                >
                  {copy.cards.view}
                  <ArrowRight className="h-3 w-3" />
                </a>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
