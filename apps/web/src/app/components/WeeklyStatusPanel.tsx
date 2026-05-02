'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { WeeklyStatus, DisciplineWeekly } from '@/app/page';
import { getDashboardCopy } from '@/app/content/dashboard';
import { useLocale } from '@/app/contexts/LocaleContext';
import { WEEKLY_STATUS_STYLES } from '@/app/content/status/weekly';

interface WeeklyStatusPanelProps {
  weeklyStatus: WeeklyStatus | null;
  disciplineWeekly: DisciplineWeekly | null;
  disciplineMissing: number;
  weekLabel: string;
  weeklyStyle: ReturnType<typeof WEEKLY_STATUS_STYLES>[string];
  nextConditionText: string | null;
  nextConditionDue: string | null;
}

export default function WeeklyStatusPanel({
  weeklyStatus,
  disciplineWeekly,
  disciplineMissing,
  weekLabel,
  weeklyStyle,
  nextConditionText,
  nextConditionDue,
}: WeeklyStatusPanelProps) {
  const { locale } = useLocale();
  const copy = getDashboardCopy(locale);

  if (!weeklyStatus && !disciplineWeekly) {
    return (
      <motion.div
        className="surface-card glow-hover p-5 mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm text-slate-400">{copy.weeklyStatus.noData}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="surface-card glow-hover p-5 mb-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Weekly Status */}
      {weeklyStatus && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">
                {copy.weeklyStatus.title}
              </p>
              {weeklyStatus.channel && (
                <p className="text-xs text-slate-400 mt-1">
                  {copy.weeklyStatus.channel}: {weeklyStatus.channel.name}
                </p>
              )}
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${weeklyStyle.badge}`}>
              <span className={`h-2 w-2 rounded-full ${weeklyStyle.dot}`} />
              {weeklyStatus.status}
            </span>
          </div>
          <p className={`text-sm ${weeklyStyle.text}`}>{nextConditionText}</p>
          {nextConditionDue && (
            <p className="text-xs text-slate-400 mt-1">{nextConditionDue}</p>
          )}
        </div>
      )}

      {/* Discipline Weekly */}
      {disciplineWeekly && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">
                {copy.cards.weeklyStreak}
              </p>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${disciplineMissing > 0 ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300' : 'border-green-500/30 bg-green-500/10 text-green-400'}`}>
              {disciplineMissing > 0 ? 'EN_RIESGO' : 'CUMPLIDA'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{copy.cards.progress}</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {disciplineWeekly.scoreboard.count}/{disciplineWeekly.scoreboard.target}
              </p>
              <p className="text-xs text-slate-400">{copy.cards.missing} {disciplineMissing}</p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{copy.cards.streak}</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {disciplineWeekly.streak.current} / {disciplineWeekly.streak.best}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
