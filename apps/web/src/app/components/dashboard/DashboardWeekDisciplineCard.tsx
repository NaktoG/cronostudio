'use client';

import { motion } from 'framer-motion';

import { WEEKLY_STATUS_STYLES } from '@/app/content/status/weekly';
import type { DashboardTab, DisciplineWeekly, WeeklyStatus } from '@/app/content/dashboardTypes';
import type { Production } from '@/app/components/ProductionsList';
import type { getDashboardCopy } from '@/app/content/dashboard';

interface SlotStatus {
  tone: string;
  dot: string;
  label: string;
}

interface NextAction {
  label: string;
  action: string;
  onClick: () => void;
}

interface DashboardWeekDisciplineCardProps {
  dashboardCopy: ReturnType<typeof getDashboardCopy>;
  reduceMotion: boolean;
  last4Weeks: NonNullable<WeeklyStatus['last4Weeks']>;
  fallbackWeeks: NonNullable<WeeklyStatus['last4Weeks']>;
  streakCurrent: number;
  streakBest: number;
  disciplineWeekly: DisciplineWeekly | null;
  weekLabel: string;
  disciplineTarget: number;
  disciplineStyle: { badge: string; dot: string };
  disciplineStatus: string;
  disciplineCount: number;
  disciplineMissing: number;
  disciplineStreakCurrent: number;
  disciplineStreakBest: number;
  slotConfig: Array<{ key: 'tue' | 'fri'; label: string }>;
  slotStatus: (slot: 'tue' | 'fri') => SlotStatus;
  openDrawerForSlot: (slot: 'tue' | 'fri') => void;
  focusOpen: boolean;
  setFocusOpen: (next: boolean | ((current: boolean) => boolean)) => void;
  focusSearch: string;
  handleFocusSearch: (value: string) => void;
  focusProduction: Production | null;
  resolveStageLabel: (status: string) => string;
  nextAction: NextAction;
  nextSlot: 'tue' | 'fri';
  plannedDays: { tue: string; fri: string };
  handleDockPlan: () => void;
  setActiveTab: (tab: DashboardTab) => void;
}

export default function DashboardWeekDisciplineCard({
  dashboardCopy,
  reduceMotion,
  last4Weeks,
  fallbackWeeks,
  streakCurrent,
  streakBest,
  disciplineWeekly,
  weekLabel,
  disciplineTarget,
  disciplineStyle,
  disciplineStatus,
  disciplineCount,
  disciplineMissing,
  disciplineStreakCurrent,
  disciplineStreakBest,
  slotConfig,
  slotStatus,
  openDrawerForSlot,
  focusOpen,
  setFocusOpen,
  focusSearch,
  handleFocusSearch,
  focusProduction,
  resolveStageLabel,
  nextAction,
  nextSlot,
  plannedDays,
  handleDockPlan,
  setActiveTab,
}: DashboardWeekDisciplineCardProps) {
  return (
    <>
      <motion.div
        className="surface-card glow-hover p-4 sm:p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em] mb-3 text-center sm:text-left">
          {dashboardCopy.weeklyStreak.title}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-center sm:text-left">
          <div>
            <p className="text-xs text-slate-400">{dashboardCopy.weeklyStreak.current}</p>
            <p className="text-lg font-semibold text-white">🔥 {streakCurrent} {dashboardCopy.cards.impactWeeks}</p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs text-slate-400">{dashboardCopy.weeklyStreak.best}</p>
            <p className="text-lg font-semibold text-white">🏆 {streakBest} {dashboardCopy.cards.impactWeeks}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {(last4Weeks.length > 0 ? last4Weeks : fallbackWeeks)
            .slice(0, 4)
            .map((week, index) => (
              <span
                key={`${week.status}-${index}`}
                className={`h-3 w-3 rounded-full ${WEEKLY_STATUS_STYLES[week.status]?.dot || 'bg-gray-700'}`}
                title={week.status}
              />
            ))}
        </div>
      </motion.div>

      <motion.div
        className="surface-card glow-hover p-4 sm:p-5"
        initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : 0.05 }}
        data-tour="week-stepper"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">
              {dashboardCopy.cards.thisWeek}
            </div>
            <p className="text-xs text-slate-400 mt-1">{dashboardCopy.cards.weekLabelPrefix} {disciplineWeekly?.week.weekKey ?? weekLabel} · {disciplineTarget} {dashboardCopy.cards.publications}</p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${disciplineStyle.badge}`}>
            <span className={`h-2 w-2 rounded-full ${disciplineStyle.dot}`} />
            {disciplineStatus}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/40 p-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{dashboardCopy.cards.progress}</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {disciplineCount}/{disciplineTarget}
            </p>
            <p className="text-xs text-slate-400">{dashboardCopy.cards.missing} {disciplineMissing}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{dashboardCopy.cards.streak}</p>
            <p className="mt-1 text-lg font-semibold text-white">🔥 {disciplineStreakCurrent}</p>
            <p className="text-xs text-slate-400">{dashboardCopy.cards.best}: {disciplineStreakBest}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {slotConfig.map((slot) => {
            const status = slotStatus(slot.key);
            return (
              <button
                key={slot.key}
                type="button"
                onClick={() => openDrawerForSlot(slot.key)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${status.tone}`}
                title={dashboardCopy.cards.viewDetail}
              >
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                  {slot.label}
                </span>
                <span>{status.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 lg:hidden">
          <button
            type="button"
            onClick={() => setFocusOpen((current) => !current)}
            className="w-full rounded-lg border border-gray-800 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300"
          >
            {focusOpen ? dashboardCopy.cards.hideFocus : dashboardCopy.cards.showFocus}
          </button>
          {focusOpen && (
            <div className="mt-3 space-y-3 rounded-xl border border-gray-800 bg-gray-900/40 p-3">
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{dashboardCopy.cards.searchProduction}</label>
                <div className="relative mt-2">
                  <input
                    value={focusSearch}
                    onChange={(event) => handleFocusSearch(event.target.value)}
                    list="focus-productions"
                    placeholder={dashboardCopy.cards.typeTitle}
                    className="w-full rounded-lg border border-gray-800 bg-gray-900/70 px-3 py-2 pr-8 text-xs text-slate-200"
                  />
                  {focusSearch && (
                    <button
                      type="button"
                      onClick={() => handleFocusSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      aria-label={dashboardCopy.cards.clearSearch}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{dashboardCopy.cards.nextStep}</div>
                {focusProduction && (
                  <div className="mt-1 text-xs text-slate-400">
                    <p className="truncate">{focusProduction.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2">
                      <span>{focusProduction.channel_name ?? dashboardCopy.labels.noChannel}</span>
                      <span className="text-slate-600">•</span>
                      <span>{resolveStageLabel(focusProduction.status)}</span>
                    </p>
                  </div>
                )}
                {!focusProduction && (
                  <p className="mt-2 text-xs text-slate-400">{dashboardCopy.cards.noActiveProductionsYet}</p>
                )}
                <p className="mt-1 text-sm text-slate-200">{nextAction.label}</p>
                <button
                  type="button"
                  onClick={nextAction.onClick}
                  className="mt-3 w-full rounded-lg bg-yellow-400 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                >
                  {nextAction.action}
                </button>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{dashboardCopy.labels.verifiedByYoutube}</div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
                  <span>{dashboardCopy.labels.tuesdayShort}</span>
                  <span>{slotStatus('tue').label}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
                  <span>{dashboardCopy.labels.fridayShort}</span>
                  <span>{slotStatus('fri').label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => openDrawerForSlot(nextSlot)}
                  className="mt-2 w-full rounded-lg border border-gray-800 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                >
                  {dashboardCopy.cards.openDetail}
                </button>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{dashboardCopy.cards.weeklyPlan}</div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
                  <span>{dashboardCopy.labels.tuesdayShort}</span>
                  <span>{plannedDays.tue}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
                  <span>{dashboardCopy.labels.fridayShort}</span>
                  <span>{plannedDays.fri}</span>
                </div>
                <button
                  type="button"
                  onClick={handleDockPlan}
                  className="mt-2 w-full rounded-lg border border-gray-800 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                >
                  {dashboardCopy.cards.goToCalendar}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('calendar')}
                  className="rounded-lg border border-gray-800 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
                >
                  {dashboardCopy.tabs.calendar}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('backlog')}
                  className="rounded-lg border border-gray-800 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
                >
                  {dashboardCopy.tabs.backlog}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('integrations')}
                  className="rounded-lg border border-gray-800 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
                >
                  {dashboardCopy.labels.integrations}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
