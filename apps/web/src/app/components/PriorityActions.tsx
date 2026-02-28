'use client';

import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, FileText, Image as ImageIcon, Lightbulb, Scissors, Search, Target, Upload } from 'lucide-react';
import { COMPONENT_COPY } from '../content/components';

interface PriorityAction {
    id: string;
    type: 'idea' | 'script' | 'seo' | 'thumbnail' | 'short' | 'publish';
    title: string;
    productionTitle: string;
    productionId: string;
    urgency: 'high' | 'medium' | 'low';
    href?: string;
}

interface PriorityActionsProps {
    actions: PriorityAction[];
    onActionClick?: (action: PriorityAction) => void;
    onCreateNew?: () => void;
    showCreateButton?: boolean;
}

const ACTION_ICONS: Record<string, ComponentType<{ className?: string }>> = {
    idea: Lightbulb,
    script: FileText,
    seo: Search,
    thumbnail: ImageIcon,
    short: Scissors,
    publish: Upload,
};

const URGENCY_STYLES: Record<string, { dot: string; bg: string }> = {
    high: { dot: 'bg-red-500', bg: 'bg-red-500/10' },
    medium: { dot: 'bg-amber-400', bg: 'bg-amber-400/10' },
    low: { dot: 'bg-emerald-400', bg: 'bg-emerald-400/10' },
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: { opacity: 1, x: 0 }
};

export default function PriorityActions({ actions, onActionClick, onCreateNew, showCreateButton = true }: PriorityActionsProps) {
    const displayActions = [...actions];

    if (displayActions.length === 0 && showCreateButton) {
        displayActions.push(
            { id: 'new-1', type: 'script', title: COMPONENT_COPY.priorityActions.createTitle, productionTitle: COMPONENT_COPY.priorityActions.createSubtitle, productionId: '', urgency: 'low' as const },
        );
    }

    return (
        <motion.div
            className="surface-card glow-hover overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-800 bg-gray-900/60">
                <span className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {COMPONENT_COPY.priorityActions.title}
                </span>
                <span className="text-xs text-slate-400">{actions.length} {COMPONENT_COPY.priorityActions.itemsLabel}</span>
            </div>

            {/* Action list */}
            <motion.div
                className="divide-y divide-gray-800/50"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {displayActions.slice(0, 3).map((action) => {
                    const styles = URGENCY_STYLES[action.urgency];
                    const hasTarget = Boolean(action.href || action.productionId);

                    const Icon = ACTION_ICONS[action.type];

                    return (
                        <motion.button
                            key={action.id}
                            type="button"
                            className={`flex w-full flex-col gap-3 px-4 sm:px-5 py-4 text-left hover:bg-gray-800/40 cursor-pointer transition-colors group sm:flex-row sm:items-center ${styles.bg} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60`}
                            onClick={() => {
                                if (action.href) {
                                    window.location.href = action.href;
                                    return;
                                }
                                if (action.productionId) {
                                    onActionClick?.(action);
                                    return;
                                }
                                onCreateNew?.();
                            }}
                            aria-label={hasTarget ? `Abrir accion ${action.title}` : 'Crear nuevo contenido'}
                            variants={itemVariants}
                            whileHover={{ x: 4 }}
                        >
                            {/* Urgency dot */}
                            <span
                                className={`w-3 h-3 rounded-full ${styles.dot} flex-shrink-0`}
                                aria-hidden="true"
                            />

                            {/* Icon */}
                            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                                <Icon className="w-4 h-4" />
                            </span>

                            {/* Action text */}
                            <div className="flex-1 min-w-0">
                                <span className="text-sm sm:text-base font-medium text-white block truncate">{action.title}</span>
                                <span className="text-xs sm:text-sm text-slate-300 truncate block">{action.productionTitle}</span>
                            </div>

                            {/* Action button */}
                            <motion.span
                                className="text-xs text-yellow-400 opacity-0 group-hover:opacity-100 font-semibold flex items-center gap-1 sm:ml-auto"
                                initial={{ x: -10 }}
                                whileHover={{ x: 0 }}
                                aria-hidden="true"
                            >
                                {COMPONENT_COPY.priorityActions.goTo} <span>→</span>
                            </motion.span>
                        </motion.button>
                    );
                })}

                {/* Empty state */}
                {actions.length === 0 && !showCreateButton && (
                    <motion.div
                        className="flex items-center gap-4 px-5 py-4 text-slate-200"
                        variants={itemVariants}
                    >
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                        </span>
                        <div className="flex-1">
                            <span className="text-base text-slate-100">{COMPONENT_COPY.priorityActions.emptyTitle}</span>
                            <span className="text-sm text-slate-400 block">{COMPONENT_COPY.priorityActions.emptySubtitle}</span>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
}
