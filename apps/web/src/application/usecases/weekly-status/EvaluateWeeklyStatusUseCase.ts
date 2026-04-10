// application/usecases/weekly-status/EvaluateWeeklyStatusUseCase.ts
// Use Case: Evaluate weekly status, tasks, and streaks

import { getDateFromIsoWeek, getIsoWeekInfo, startOfIsoWeek, endOfIsoWeek } from '@/lib/dates';
import { evaluateEstadoSemana, WeeklyGoalConfig, WeeklyPipelineState } from '@/lib/weeklyStatus';
import { isIdeaReady } from '@/lib/ideaReady';
import { ProductionReadinessService } from '@/application/services/ProductionReadinessService';
import { BuildWeeklyTasksUseCase, WeeklyTask } from '@/application/usecases/weekly-status/BuildWeeklyTasksUseCase';
import { CalculateWeeklyStreakUseCase } from '@/application/usecases/weekly-status/CalculateWeeklyStreakUseCase';
import { PostgresWeeklyStatusRepository } from '@/infrastructure/repositories/PostgresWeeklyStatusRepository';

type PublishedSummary = {
    id: string;
    title: string;
    publishedAt: string;
};

type PlannedProduction = {
    id: string;
    title: string;
    day: string | null;
    status: string;
};

type WeeklyComputed = {
    goal: WeeklyGoalConfig;
    state: WeeklyPipelineState;
    evaluation: ReturnType<typeof evaluateEstadoSemana>;
    publishedThisWeek: PublishedSummary[];
    plannedProductions: PlannedProduction[];
    planGenerated: boolean;
};

export type WeeklyStatusResponse = {
    status: ReturnType<typeof evaluateEstadoSemana>['status'];
    nextCondition: ReturnType<typeof evaluateEstadoSemana>['nextCondition'] extends infer T
        ? T extends null
            ? null
            : { label: string; dueAt: string; missing: string[] }
        : null;
    channel: { id: string; name: string };
    channelSource: 'explicit' | 'default';
    goal: WeeklyGoalConfig;
    week: { isoYear: number; isoWeek: number; startDate: string; endDate: string };
    publishedCount: number;
    publishedThisWeek: PublishedSummary[];
    planGenerated: boolean;
    plannedProductions: PlannedProduction[];
    currentStreak: number;
    bestStreak: number;
    last4Weeks: Array<{ isoYear: number; isoWeek: number; status: 'OK' | 'EN_RIESGO' | 'FALLIDA' }>;
    tasks: WeeklyTask[];
};

export type WeeklyStatusResult =
    | { ok: true; data: WeeklyStatusResponse }
    | { ok: false; status: number; error: string };

function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export class EvaluateWeeklyStatusUseCase {
    constructor(
        private repository: PostgresWeeklyStatusRepository,
        private readinessService: ProductionReadinessService,
        private buildWeeklyTasksUseCase: BuildWeeklyTasksUseCase,
        private calculateWeeklyStreakUseCase: CalculateWeeklyStreakUseCase
    ) { }

    async execute(params: { userId: string; channelIdParam: string | null; isoYearParam: string | null; isoWeekParam: string | null; now: Date }): Promise<WeeklyStatusResult> {
        const { userId, channelIdParam, isoYearParam, isoWeekParam, now } = params;
        const isoInfo = getIsoWeekInfo(now);
        const isoYear = isoYearParam ? Number(isoYearParam) : isoInfo.isoYear;
        const isoWeek = isoWeekParam ? Number(isoWeekParam) : isoInfo.isoWeek;

        if (!Number.isInteger(isoYear) || isoYear < 2000 || isoYear > 2100) {
            return { ok: false, status: 400, error: 'isoYear inválido' };
        }
        if (!Number.isInteger(isoWeek) || isoWeek < 1 || isoWeek > 53) {
            return { ok: false, status: 400, error: 'isoWeek inválido' };
        }

        const weekStart = isoYearParam || isoWeekParam
            ? getDateFromIsoWeek(isoYear, isoWeek)
            : startOfIsoWeek(now);
        const weekEnd = endOfIsoWeek(weekStart);
        const isoInfoFromStart = getIsoWeekInfo(weekStart);

        const channel = await this.repository.resolveChannel(userId, channelIdParam);
        if (!channel) {
            return { ok: false, status: 400, error: 'Canal requerido' };
        }
        const channelId = channel.id as string;

        const computed = await this.computeWeeklyData(userId, channelId, weekStart, weekEnd, now);
        const tasks = this.buildWeeklyTasksUseCase.execute({
            now,
            goal: computed.goal,
            state: computed.state,
            conditions: computed.evaluation.conditions,
            nextCondition: computed.evaluation.nextCondition,
        });
        const streak = await this.calculateWeeklyStreakUseCase.execute({
            userId,
            channelId,
            now,
            computeWeeklyData: this.computeWeeklyData.bind(this),
        });

        return {
            ok: true,
            data: {
                status: computed.evaluation.status,
                nextCondition: computed.evaluation.nextCondition
                    ? {
                        label: computed.evaluation.nextCondition.label,
                        dueAt: computed.evaluation.nextCondition.dueAt.toISOString(),
                        missing: computed.evaluation.nextCondition.missing,
                    }
                    : null,
                channel: { id: channelId, name: channel.name },
                channelSource: channel.source,
                goal: computed.goal,
                week: {
                    isoYear: isoInfoFromStart.isoYear,
                    isoWeek: isoInfoFromStart.isoWeek,
                    startDate: formatDate(weekStart),
                    endDate: formatDate(weekEnd),
                },
                publishedCount: computed.state.publishedCount,
                publishedThisWeek: computed.publishedThisWeek,
                planGenerated: computed.planGenerated,
                plannedProductions: computed.plannedProductions,
                currentStreak: streak.currentStreak,
                bestStreak: streak.bestStreak,
                last4Weeks: streak.last4Weeks,
                tasks,
            },
        };
    }

    async computeWeeklyData(userId: string, channelId: string, weekStart: Date, weekEnd: Date, nowForEval: Date): Promise<WeeklyComputed> {
        const weekIsoInfo = getIsoWeekInfo(weekStart);
        const goalsResult = await this.repository.getWeeklyGoal(userId, channelId, weekIsoInfo.isoYear, weekIsoInfo.isoWeek);

        const goal: WeeklyGoalConfig = goalsResult
            ? {
                targetVideos: goalsResult.target_videos,
                diasPublicacion: goalsResult.dias_publicacion,
                horaCorte: goalsResult.hora_corte,
            }
            : {
                targetVideos: 2,
                diasPublicacion: ['tuesday', 'friday'],
                horaCorte: '12:00',
            };

        const ideasResult = await this.repository.listIdeas(userId, channelId);
        const ideasReady = ideasResult.filter((row) => isIdeaReady(row.title as string, row.description as string | null)).length;

        const productionsResult = await this.repository.listProductionsForWeek(userId, channelId, weekIsoInfo.isoYear, weekIsoInfo.isoWeek);
        let productionRows = productionsResult;

        if (productionRows.length === 0) {
            const fallbackRows = await this.repository.listProductionsForDateRange(
                userId,
                channelId,
                formatDate(weekStart),
                formatDate(weekEnd)
            );
            productionRows = fallbackRows;
        }

        const plannedProductions: PlannedProduction[] = productionRows.map((row) => ({
            id: row.id as string,
            title: row.title as string,
            day: (row.planned_publish_day as string | null) ?? null,
            status: row.status as string,
        }));
        const planGenerated = plannedProductions.length >= 2;

        const productions = productionRows.map((row) => ({
            id: row.id as string,
            title: row.title as string,
            targetDate: row.target_date ? new Date(row.target_date as string) : null,
            scriptComplete: this.readinessService.isScriptComplete(row),
            thumbnailComplete: this.readinessService.isThumbnailComplete(row),
            seoComplete: this.readinessService.isSeoComplete(row),
            published: row.status === 'published' || Boolean(row.published_at),
        }));

        const tuesdayRow = productionRows.find((row) => row.planned_publish_day === 'tuesday') ?? null;
        const fridayRow = productionRows.find((row) => row.planned_publish_day === 'friday') ?? null;
        const video1 = tuesdayRow
            ? productions.find((prod) => prod.id === tuesdayRow.id) ?? null
            : productions[0] ?? null;
        const video2 = fridayRow
            ? productions.find((prod) => prod.id === fridayRow.id) ?? null
            : productions[1] ?? null;

        const publishedResult = await this.repository.listPublishedThisWeek(
            userId,
            channelId,
            weekStart.toISOString(),
            weekEnd.toISOString()
        );
        const publishedThisWeek: PublishedSummary[] = publishedResult.map((row) => ({
            id: row.id as string,
            title: row.title as string,
            publishedAt: new Date(row.published_at as string).toISOString(),
        }));
        const publishedCount = publishedThisWeek.length;

        const state: WeeklyPipelineState = {
            ideasReady,
            video1,
            video2,
            publishedCount,
        };

        const evaluation = evaluateEstadoSemana(nowForEval, state, goal);

        return {
            goal,
            state,
            evaluation,
            publishedThisWeek,
            plannedProductions,
            planGenerated,
        };
    }
}
