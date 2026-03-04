'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Bot, CheckCircle2, Loader2 } from 'lucide-react';
import { COMPONENT_COPY } from '../content/components';
import { AutomationRunStatus } from '../content/labels';
import { AUTOMATION_STATUS_STYLES } from '@/app/content/status/automation';
import { formatDayMonth } from '@/lib/dates';

export interface AutomationRun {
    id: string;
    workflow_name: string;
    status: 'running' | 'completed' | 'error';
    started_at: string;
    completed_at?: string;
    error_message?: string;
}

interface AutomationRunsProps {
    runs: AutomationRun[];
    onRunClick?: (run: AutomationRun) => void;
}

const STATUS_CONFIG: Record<AutomationRunStatus, { dot: string; icon: typeof Loader2; label: string }> = {
    running: { dot: `${AUTOMATION_STATUS_STYLES.running.dot} animate-pulse`, icon: Loader2, label: AUTOMATION_STATUS_STYLES.running.label },
    completed: { dot: AUTOMATION_STATUS_STYLES.completed.dot, icon: CheckCircle2, label: AUTOMATION_STATUS_STYLES.completed.label },
    error: { dot: AUTOMATION_STATUS_STYLES.error.dot, icon: AlertTriangle, label: AUTOMATION_STATUS_STYLES.error.label },
};

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return COMPONENT_COPY.automationRuns.now;
    if (diffMins < 60) return COMPONENT_COPY.automationRuns.minutesAgo.replace('{n}', String(diffMins));
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return COMPONENT_COPY.automationRuns.hoursAgo.replace('{n}', String(diffHours));
    return formatDayMonth(date);
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: 10 },
    visible: { opacity: 1, x: 0 }
};

export default function AutomationRuns({ runs, onRunClick }: AutomationRunsProps) {
    return (
        <motion.div
            className="surface-card glow-hover overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
        >
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-800 bg-slate-900/70">
                <span className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">{COMPONENT_COPY.automationRuns.title}</span>
                <span className="text-xs text-slate-400">{runs.length} {COMPONENT_COPY.automationRuns.runsLabel}</span>
            </div>

            {/* Runs list */}
            <motion.div
                className="divide-y divide-gray-800/50"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {runs.length === 0 ? (
                    <motion.div
                        className="px-4 sm:px-5 py-5 flex items-center gap-3 text-slate-200"
                        variants={itemVariants}
                    >
                        <span className="w-9 h-9 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                            <Bot className="w-4 h-4" />
                        </span>
                        <div>
                            <span className="text-base block">{COMPONENT_COPY.automationRuns.emptyTitle}</span>
                            <span className="text-sm text-slate-400">{COMPONENT_COPY.automationRuns.emptySubtitle}</span>
                        </div>
                    </motion.div>
                ) : (
                    runs.slice(0, 3).map((run) => {
                        const config = STATUS_CONFIG[run.status];
                        const Icon = config.icon;

                        return (
                            <motion.button
                                key={run.id}
                                type="button"
                                className="flex w-full flex-col gap-3 px-4 sm:px-5 py-4 text-left hover:bg-slate-800/40 cursor-pointer transition-colors group sm:flex-row sm:items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60"
                                onClick={() => onRunClick?.(run)}
                                aria-label={`Ver ejecucion ${run.workflow_name}`}
                                variants={itemVariants}
                                whileHover={{ x: 3 }}
                            >
                                <motion.span
                                    className={`w-3 h-3 rounded-full ${config.dot} flex-shrink-0`}
                                    animate={run.status === 'running' ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                />
                                <span className="w-8 h-8 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                                    <Icon className={`w-4 h-4 ${run.status === 'running' ? 'animate-spin' : ''}`} />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm sm:text-base text-white truncate block font-medium">{run.workflow_name}</span>
                                    <span className="text-xs sm:text-sm text-slate-300">{config.label}</span>
                                </div>
                                <span className="text-xs sm:text-sm text-slate-300 sm:ml-auto">{formatTimeAgo(run.started_at)}</span>
                            </motion.button>
                        );
                    })
                )}
            </motion.div>
        </motion.div>
    );
}
