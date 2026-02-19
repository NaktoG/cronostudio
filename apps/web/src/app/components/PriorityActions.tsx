'use client';

import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, FileText, Image as ImageIcon, Scissors, Search, Target, Upload } from 'lucide-react';
import type { PendingActionItem } from '@/domain/types/actions';
import type { PendingActionType } from '@/domain/types';
import { UI_COPY } from '@/config/uiCopy';

interface PriorityActionsProps {
    actions: PendingActionItem[];
    onActionPrimaryClick?: (action: PendingActionItem) => void;
    onActionSecondaryClick?: (action: PendingActionItem) => void;
    onCreateNew?: () => void;
}

const ACTION_ICONS: Record<PendingActionType, ComponentType<{ className?: string }>> = {
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

export default function PriorityActions({ actions, onActionPrimaryClick, onActionSecondaryClick, onCreateNew }: PriorityActionsProps) {
    const copy = UI_COPY.pendingActions;
    return (
        <motion.div
            className="surface-card glow-hover overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/60">
                <span className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {UI_COPY.dashboard.sections.pending}
                </span>
                <span className="text-xs text-slate-400">{actions.length} {copy.itemsLabel}</span>
            </div>

            {/* Action list */}
            <motion.div
                className="divide-y divide-gray-800/50"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {actions.slice(0, 5).map((action) => {
                    const styles = URGENCY_STYLES[action.urgency];

                    const Icon = ACTION_ICONS[action.type];

                    return (
                        <motion.div
                            key={action.id}
                            className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-800/40 transition-colors group ${styles.bg}`}
                            variants={itemVariants}
                            whileHover={{ x: 4 }}
                        >
                            {/* Urgency dot */}
                            <motion.span
                                className={`w-3 h-3 rounded-full ${styles.dot} flex-shrink-0`}
                                animate={{ scale: action.urgency === 'high' ? [1, 1.2, 1] : 1 }}
                                transition={{ repeat: action.urgency === 'high' ? Infinity : 0, duration: 1.5 }}
                            />

                            {/* Icon */}
                            <span className="w-9 h-9 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                                <Icon className="w-4 h-4" />
                            </span>

                            {/* Action text */}
                            <div className="flex-1 min-w-0">
                                <span className="text-base font-medium text-white block truncate">{action.title}</span>
                                <span className="text-sm text-slate-300 truncate block">{action.productionTitle}</span>
                            </div>

                            {/* Action button */}
                            <div className="flex items-center gap-3">
                                <motion.button
                                    type="button"
                                    onClick={() => onActionPrimaryClick?.(action)}
                                    disabled={!onActionPrimaryClick}
                                    className="text-xs text-yellow-400 opacity-0 group-hover:opacity-100 font-semibold flex items-center gap-1"
                                    initial={{ x: -10 }}
                                    whileHover={{ x: 0 }}
                                    whileTap={{ scale: 0.97 }}
                                    aria-label={action.primaryCta.label}
                                >
                                    {action.primaryCta.label} <span>→</span>
                                </motion.button>
                                <motion.button
                                    type="button"
                                    onClick={() => onActionSecondaryClick?.(action)}
                                    disabled={!onActionSecondaryClick}
                                    className="text-xs text-slate-300 opacity-0 group-hover:opacity-100 font-semibold disabled:opacity-40"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    aria-label={action.secondaryCta.label}
                                >
                                    {action.secondaryCta.label}
                                </motion.button>
                            </div>
                        </motion.div>
                    );
                })}

                {/* Empty state */}
                {actions.length === 0 && (
                    <motion.div
                        className="flex items-center gap-4 px-5 py-4 text-slate-200"
                        variants={itemVariants}
                    >
                        <span className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                        </span>
                        <div className="flex-1">
                            <span className="text-base text-slate-100">{copy.emptyTitle}</span>
                            <span className="text-sm text-slate-400 block">{copy.emptyDescription}</span>
                        </div>
                        <motion.button
                            type="button"
                            onClick={onCreateNew}
                            disabled={!onCreateNew}
                            className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold flex items-center gap-1 disabled:opacity-50"
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {copy.emptyAction} <span>→</span>
                        </motion.button>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
}
