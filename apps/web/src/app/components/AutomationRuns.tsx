'use client';

import { motion } from 'framer-motion';

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

const STATUS_CONFIG = {
    running: { dot: 'bg-yellow-500 animate-pulse', icon: '⏳', label: 'En progreso' },
    completed: { dot: 'bg-green-500', icon: '✅', label: 'Completado' },
    error: { dot: 'bg-red-500', icon: '❌', label: 'Error' },
};

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'ahora';
    if (diffMins < 60) return `hace ${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `hace ${diffHours}h`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
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
            className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/60">
                <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">⚡ Automatizaciones</span>
                <span className="text-sm text-gray-500">{runs.length} runs</span>
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
                        className="px-5 py-5 flex items-center gap-3 text-gray-400"
                        variants={itemVariants}
                    >
                        <span className="text-2xl">🤖</span>
                        <div>
                            <span className="text-base block">Sin ejecuciones recientes</span>
                            <span className="text-sm text-gray-500">Los agentes están listos</span>
                        </div>
                    </motion.div>
                ) : (
                    runs.slice(0, 3).map((run) => {
                        const config = STATUS_CONFIG[run.status];

                        return (
                            <motion.div
                                key={run.id}
                                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/40 cursor-pointer transition-colors group"
                                onClick={() => onRunClick?.(run)}
                                variants={itemVariants}
                                whileHover={{ x: 3 }}
                            >
                                <motion.span
                                    className={`w-3 h-3 rounded-full ${config.dot} flex-shrink-0`}
                                    animate={run.status === 'running' ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                />
                                <span className="text-xl">{config.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <span className="text-base text-white truncate block font-medium">{run.workflow_name}</span>
                                    <span className="text-sm text-gray-500">{config.label}</span>
                                </div>
                                <span className="text-sm text-gray-500">{formatTimeAgo(run.started_at)}</span>
                            </motion.div>
                        );
                    })
                )}
            </motion.div>
        </motion.div>
    );
}
