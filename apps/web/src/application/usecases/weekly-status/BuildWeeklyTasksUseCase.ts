// application/usecases/weekly-status/BuildWeeklyTasksUseCase.ts
// Use Case: Build weekly tasks based on conditions

import { WeeklyGoalConfig, WeeklyPipelineState } from '@/lib/weeklyStatus';

export type WeeklyTask = {
    id: string;
    type: 'idea' | 'script' | 'thumbnail' | 'seo' | 'publish';
    title: string;
    productionTitle: string;
    productionId: string;
    urgency: 'high' | 'medium' | 'low';
    href: string;
};

type WeeklyCondition = {
    key: string;
    label: string;
    dueAt: Date;
    isMet: boolean;
    missing: string[];
};

export class BuildWeeklyTasksUseCase {
    execute(params: {
        now: Date;
        goal: WeeklyGoalConfig;
        state: WeeklyPipelineState;
        conditions: WeeklyCondition[];
        nextCondition: WeeklyCondition | null;
    }): WeeklyTask[] {
        const { now, goal, state, conditions, nextCondition } = params;
        const dayMap: Record<number, string> = {
            0: 'sunday',
            1: 'monday',
            2: 'tuesday',
            3: 'wednesday',
            4: 'thursday',
            5: 'friday',
            6: 'saturday',
        };
        const today = dayMap[now.getDay()];
        const publishDays = goal.diasPublicacion.map((day) => day.toLowerCase());
        const publishTask: WeeklyTask[] = [];
        if (publishDays.includes(today)) {
            const publishIndex = publishDays.indexOf(today);
            const targetProduction = publishIndex === 0 ? state.video1 : state.video2;
            if (targetProduction && !targetProduction.published) {
                publishTask.push({
                    id: `publish-${targetProduction.id}`,
                    type: 'publish',
                    title: `Publicar ${targetProduction.title} (Marcar como publicado)`,
                    productionTitle: targetProduction.title,
                    productionId: targetProduction.id,
                    urgency: 'high',
                    href: '/',
                });
            }
        }

        const dueConditions = conditions.filter((condition) => now.getTime() >= condition.dueAt.getTime() && !condition.isMet);
        const targetConditions = dueConditions.length > 0 ? dueConditions : (nextCondition ? [nextCondition] : []);
        const tasks: WeeklyTask[] = [];

        const addTask = (task: WeeklyTask) => {
            tasks.push(task);
        };

        for (const condition of targetConditions) {
            const urgency: WeeklyTask['urgency'] = now.getTime() >= condition.dueAt.getTime() ? 'high' : 'medium';
            switch (condition.key) {
                case 'monday-ideas': {
                    const missing = Math.max(goal.targetVideos - state.ideasReady, 0);
                    if (missing > 0) {
                        addTask({
                            id: 'ideas-ready',
                            type: 'idea',
                            title: `Completar ${missing} ideas con DoD`,
                            productionTitle: 'Ideas',
                            productionId: '',
                            urgency,
                            href: '/ideas',
                        });
                    }
                    break;
                }
                case 'tuesday-video1': {
                    if (!state.video1) {
                        addTask({
                            id: 'video1-create',
                            type: 'script',
                            title: 'Crear video 1 para martes',
                            productionTitle: 'Video 1',
                            productionId: '',
                            urgency,
                            href: '/',
                        });
                        break;
                    }
                    if (!state.video1.scriptComplete) {
                        addTask({
                            id: 'video1-script',
                            type: 'script',
                            title: `Completar guion de ${state.video1.title}`,
                            productionTitle: state.video1.title,
                            productionId: state.video1.id,
                            urgency,
                            href: '/scripts',
                        });
                    }
                    if (!state.video1.thumbnailComplete) {
                        addTask({
                            id: 'video1-thumbnail',
                            type: 'thumbnail',
                            title: `Completar miniatura de ${state.video1.title}`,
                            productionTitle: state.video1.title,
                            productionId: state.video1.id,
                            urgency,
                            href: '/thumbnails',
                        });
                    }
                    if (!state.video1.seoComplete) {
                        addTask({
                            id: 'video1-seo',
                            type: 'seo',
                            title: `Completar SEO de ${state.video1.title}`,
                            productionTitle: state.video1.title,
                            productionId: state.video1.id,
                            urgency,
                            href: '/seo',
                        });
                    }
                    break;
                }
                case 'wednesday-script': {
                    if (!state.video2) {
                        addTask({
                            id: 'video2-create',
                            type: 'script',
                            title: 'Crear video 2 para viernes',
                            productionTitle: 'Video 2',
                            productionId: '',
                            urgency,
                            href: '/',
                        });
                        break;
                    }
                    if (!state.video2.scriptComplete) {
                        addTask({
                            id: 'video2-script',
                            type: 'script',
                            title: `Completar guion de ${state.video2.title}`,
                            productionTitle: state.video2.title,
                            productionId: state.video2.id,
                            urgency,
                            href: '/scripts',
                        });
                    }
                    break;
                }
                case 'thursday-assets': {
                    if (!state.video2) {
                        addTask({
                            id: 'video2-assets-missing',
                            type: 'thumbnail',
                            title: 'Preparar video 2 para viernes',
                            productionTitle: 'Video 2',
                            productionId: '',
                            urgency,
                            href: '/',
                        });
                        break;
                    }
                    if (!state.video2.thumbnailComplete) {
                        addTask({
                            id: 'video2-thumbnail',
                            type: 'thumbnail',
                            title: `Completar miniatura de ${state.video2.title}`,
                            productionTitle: state.video2.title,
                            productionId: state.video2.id,
                            urgency,
                            href: '/thumbnails',
                        });
                    }
                    if (!state.video2.seoComplete) {
                        addTask({
                            id: 'video2-seo',
                            type: 'seo',
                            title: `Completar SEO de ${state.video2.title}`,
                            productionTitle: state.video2.title,
                            productionId: state.video2.id,
                            urgency,
                            href: '/seo',
                        });
                    }
                    break;
                }
                case 'friday-publish': {
                    if (!state.video2) {
                        addTask({
                            id: 'video2-publish-missing',
                            type: 'publish',
                            title: 'Publicar video 2',
                            productionTitle: 'Video 2',
                            productionId: '',
                            urgency,
                            href: '/',
                        });
                        break;
                    }
                    if (!state.video2.published) {
                        addTask({
                            id: 'video2-publish',
                            type: 'publish',
                            title: `Publicar ${state.video2.title}`,
                            productionTitle: state.video2.title,
                            productionId: state.video2.id,
                            urgency,
                            href: '/',
                        });
                    }
                    break;
                }
                default:
                    break;
            }
        }

        const urgencyOrder: Record<WeeklyTask['urgency'], number> = { high: 0, medium: 1, low: 2 };
        const sorted = tasks.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
        const merged = publishTask.length > 0 ? [...publishTask, ...sorted] : sorted;
        const unique = merged.filter((task, index) => merged.findIndex((item) => item.id === task.id) === index);
        return unique.slice(0, 3);
    }
}
