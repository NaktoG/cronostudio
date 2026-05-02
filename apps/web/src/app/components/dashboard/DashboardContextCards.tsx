'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

import type { Channel, WeeklyGoalResponse, WeeklyStatus } from '@/app/content/dashboardTypes';
import type { getDashboardCopy } from '@/app/content/dashboard';

interface ReconcileMessage {
  message: string;
  actionLabel: string;
  actionHref: string;
}

interface DashboardContextCardsProps {
  dashboardCopy: ReturnType<typeof getDashboardCopy>;
  weekLabel: string;
  goalData: WeeklyGoalResponse['goal'] | WeeklyStatus['goal'] | null;
  weeklyTarget: number;
  goalDays: string;
  publishedCount: number;
  weeklyError: string | null;
  reconcileMessage: ReconcileMessage | null;
  isDefaultChannel: boolean;
  channelName: string;
  selectedChannelId: string;
  channels: Channel[];
  onChannelChange: (channelId: string) => void;
  onRetryWeeklyStatus: () => void;
  shouldShowAutoPlanCard: boolean;
  onGeneratePlan: () => void;
  planSubmitting: boolean;
  showStartCard: boolean;
}

export default function DashboardContextCards({
  dashboardCopy,
  weekLabel,
  goalData,
  weeklyTarget,
  goalDays,
  publishedCount,
  weeklyError,
  reconcileMessage,
  isDefaultChannel,
  channelName,
  selectedChannelId,
  channels,
  onChannelChange,
  onRetryWeeklyStatus,
  shouldShowAutoPlanCard,
  onGeneratePlan,
  planSubmitting,
  showStartCard,
}: DashboardContextCardsProps) {
  return (
    <>
      <motion.div
        className="surface-card glow-hover p-4 sm:p-5 mb-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">
              {dashboardCopy.context.title}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-gray-800 px-3 py-1 text-slate-200">
                {dashboardCopy.context.isoWeek}: {weekLabel}
              </span>
              {goalData && (
                <span className="rounded-full border border-gray-800 px-3 py-1 text-slate-200">
                  {dashboardCopy.context.goal}: {weeklyTarget} {dashboardCopy.context.videos} · {goalDays} · {goalData.horaCorte}
                </span>
              )}
              {weeklyTarget > 0 && (
                <span className="rounded-full border border-gray-800 px-3 py-1 text-slate-200">
                  {dashboardCopy.context.published}: {publishedCount}/{weeklyTarget}
                </span>
              )}
            </div>
            {weeklyError && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-red-300">
                <span>{dashboardCopy.messages.weekEvaluationFailed}</span>
                <button
                  type="button"
                  onClick={onRetryWeeklyStatus}
                  className="text-yellow-300 hover:text-yellow-200 underline"
                >
                  {dashboardCopy.common.retry}
                </button>
              </div>
            )}
            {reconcileMessage && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-amber-300">
                <span>{reconcileMessage.message}</span>
                {reconcileMessage.actionLabel && reconcileMessage.actionHref && (
                  <Link
                    href={reconcileMessage.actionHref}
                    className="text-yellow-300 hover:text-yellow-200 underline"
                  >
                    {reconcileMessage.actionLabel}
                  </Link>
                )}
              </div>
            )}
            {isDefaultChannel && channelName && (
              <p className="text-xs text-amber-200">
                {dashboardCopy.context.defaultChannel}: {channelName}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-[0.2em]">
              {dashboardCopy.context.channel}
            </label>
            <select
              value={selectedChannelId}
              onChange={(event) => onChannelChange(event.target.value)}
              className="w-full min-w-[220px] rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white"
              disabled={channels.length === 0}
            >
              <option value="">{channels.length === 0 ? dashboardCopy.context.noChannels : dashboardCopy.context.selectChannel}</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {shouldShowAutoPlanCard && (
        <motion.div
          className="surface-card glow-hover p-5 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div>
            <p className="text-sm text-slate-300">{dashboardCopy.cards.weeklyAutoPlanTitle}</p>
            <p className="text-xs text-slate-400">{dashboardCopy.cards.weeklyAutoPlanSubtitle}</p>
          </div>
          <motion.button
            type="button"
            onClick={onGeneratePlan}
            className="px-5 py-3 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={planSubmitting}
          >
            {planSubmitting ? dashboardCopy.cards.weeklyAutoPlanGenerating : dashboardCopy.cards.weeklyAutoPlanGenerate}
          </motion.button>
        </motion.div>
      )}

      {showStartCard && (
        <motion.div
          className="surface-card glow-hover p-5 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div>
            <p className="text-sm text-slate-300">{dashboardCopy.cards.firstStepsTitle}</p>
            <p className="text-xs text-slate-400">{dashboardCopy.messages.startCardHint}</p>
          </div>
          <Link
            href="/start"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-400 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black"
          >
            {dashboardCopy.cards.viewGuide}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}
    </>
  );
}
