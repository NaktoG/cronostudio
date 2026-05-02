import { useMemo } from 'react';
import type { WeeklyStatus, DisciplineWeekly } from '@/app/page';
import { getDashboardCopy } from '@/app/content/dashboard';
import { useLocale } from '@/app/contexts/LocaleContext';

interface UseWeeklyStatusPanelProps {
  weeklyStatus: WeeklyStatus | null;
  disciplineWeekly: DisciplineWeekly | null;
  disciplineMissing: number;
  weekLabel: string;
  streakCurrent: number;
  streakBest: number;
  disciplineStyle: { badge: string; dot: string; text: string };
}

export function useWeeklyStatusPanel({
  weeklyStatus,
  disciplineWeekly,
  disciplineMissing,
  weekLabel,
  streakCurrent,
  streakBest,
  disciplineStyle,
}: UseWeeklyStatusPanelProps) {
  const { locale } = useLocale();
  const copy = useMemo(() => getDashboardCopy(locale), [locale]);

  const weeklyData = useMemo(() => {
    if (!weeklyStatus) return null;
    return {
      channelName: weeklyStatus.channel?.name ?? '',
      status: weeklyStatus.status,
      nextConditionText: weeklyStatus.nextCondition?.label ?? copy.weeklyStatus.noNext,
      nextConditionDue: weeklyStatus.nextCondition?.dueAt
        ? new Date(weeklyStatus.nextCondition.dueAt).toLocaleString()
        : null,
    };
  }, [weeklyStatus, copy.weeklyStatus.noNext]);

  const disciplineData = useMemo(() => {
    if (!disciplineWeekly) return null;
    return {
      count: disciplineWeekly.scoreboard.count,
      target: disciplineWeekly.scoreboard.target,
      missing: Math.max(disciplineWeekly.scoreboard.target - disciplineWeekly.scoreboard.count, 0),
      streakCurrent: disciplineWeekly.streak.current,
      streakBest: disciplineWeekly.streak.best,
    };
  }, [disciplineWeekly]);

  return {
    copy,
    weeklyData,
    disciplineData,
    disciplineMissing,
    weekLabel,
    streakCurrent,
    streakBest,
    disciplineStyle,
  };
}
