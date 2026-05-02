'use client';

import { motion } from 'framer-motion';

import { WEEKLY_STATUS_STYLES } from '@/app/content/status/weekly';
import type { WeeklyStatus } from '@/app/content/dashboardTypes';
import type { getDashboardCopy } from '@/app/content/dashboard';

interface DashboardWeeklyStatusCardProps {
  dashboardCopy: ReturnType<typeof getDashboardCopy>;
  weeklyStatus: WeeklyStatus | null;
  nextConditionText: string;
  nextConditionDue: string | null;
}

export default function DashboardWeeklyStatusCard({
  dashboardCopy,
  weeklyStatus,
  nextConditionText,
  nextConditionDue,
}: DashboardWeeklyStatusCardProps) {
  const weeklyStyle = weeklyStatus ? WEEKLY_STATUS_STYLES[weeklyStatus.status] : WEEKLY_STATUS_STYLES.OK;

  return (
    <motion.div
      className="surface-card glow-hover p-4 sm:p-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-center sm:text-left">
          <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">
            {dashboardCopy.weeklyStatus.title}
          </div>
          {weeklyStatus?.channel && (
            <p className="text-xs text-slate-400 mt-1">
              {dashboardCopy.weeklyStatus.channel}: {weeklyStatus.channel.name}
            </p>
          )}
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${weeklyStyle.badge} self-center sm:self-auto`}>
          <span className={`h-2 w-2 rounded-full ${weeklyStyle.dot}`} />
          {weeklyStatus?.status ?? 'OK'}
        </span>
      </div>
      <div className="mt-4 space-y-2">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-[0.2em]">
          {dashboardCopy.weeklyStatus.next}
        </div>
        <p className={`text-sm ${weeklyStyle.text}`}>{nextConditionText}</p>
        {nextConditionDue && (
          <p className="text-xs text-slate-400">{nextConditionDue}</p>
        )}
      </div>
    </motion.div>
  );
}
