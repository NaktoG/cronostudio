// application/usecases/weekly-status/CalculateWeeklyStreakUseCase.ts
// Use Case: Calculate weekly streaks

import { endOfIsoWeek, startOfIsoWeek } from '@/lib/dates';
import { getIsoWeekInfo } from '@/lib/dates';

type WeekStatus = {
    isoYear: number;
    isoWeek: number;
    status: 'OK' | 'EN_RIESGO' | 'FALLIDA';
};

export class CalculateWeeklyStreakUseCase {
    async execute(params: {
        userId: string;
        channelId: string;
        now: Date;
        computeWeeklyData: (userId: string, channelId: string, weekStart: Date, weekEnd: Date, nowForEval: Date) => Promise<{ evaluation: { status: 'OK' | 'EN_RIESGO' | 'FALLIDA' } }>;
    }) {
        const { userId, channelId, now, computeWeeklyData } = params;
        const maxWeeks = 52;
        const statuses: WeekStatus[] = [];
        let currentStreak = 0;
        let bestStreak = 0;
        let runningStreak = 0;

        const currentWeekStart = startOfIsoWeek(now);

        for (let offset = maxWeeks - 1; offset >= 0; offset -= 1) {
            const weekStart = new Date(currentWeekStart.getTime());
            weekStart.setDate(currentWeekStart.getDate() - offset * 7);
            const weekEnd = endOfIsoWeek(weekStart);
            const weekInfo = getIsoWeekInfo(weekStart);
            const isCurrent = weekInfo.isoYear === getIsoWeekInfo(now).isoYear && weekInfo.isoWeek === getIsoWeekInfo(now).isoWeek;
            const evalNow = isCurrent ? now : new Date(weekEnd.getTime() + 60 * 1000);
            const computed = await computeWeeklyData(userId, channelId, weekStart, weekEnd, evalNow);
            statuses.push({ isoYear: weekInfo.isoYear, isoWeek: weekInfo.isoWeek, status: computed.evaluation.status });
        }

        for (const entry of statuses) {
            if (entry.status === 'FALLIDA') {
                runningStreak = 0;
            } else {
                runningStreak += 1;
                if (runningStreak > bestStreak) bestStreak = runningStreak;
            }
        }

        for (let i = statuses.length - 1; i >= 0; i -= 1) {
            if (statuses[i].status === 'FALLIDA') break;
            currentStreak += 1;
        }

        const last4Weeks = statuses.slice(-4);

        return {
            currentStreak,
            bestStreak,
            last4Weeks,
        };
    }
}
