'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, FileText, Film, Lightbulb, Smartphone, Scissors, Upload, Video } from 'lucide-react';
import type { Production, ProductionStatus } from '@/domain/types';
import { UI_COPY } from '@/config/uiCopy';

interface ProductionsListProps {
    productions: Production[];
    onProductionClick?: (production: Production) => void;
}

const STATUS_BADGE: Record<ProductionStatus, { label: string; color: string; icon: typeof Lightbulb }> = {
    idea: { label: UI_COPY.productionStatusLabels.idea, color: 'bg-slate-600', icon: Lightbulb },
    scripting: { label: UI_COPY.productionStatusLabels.scripting, color: 'bg-blue-600', icon: FileText },
    recording: { label: UI_COPY.productionStatusLabels.recording, color: 'bg-purple-600', icon: Video },
    editing: { label: UI_COPY.productionStatusLabels.editing, color: 'bg-orange-600', icon: Scissors },
    shorts: { label: UI_COPY.productionStatusLabels.shorts, color: 'bg-cyan-600', icon: Smartphone },
    publishing: { label: UI_COPY.productionStatusLabels.publishing, color: 'bg-yellow-600', icon: Upload },
    published: { label: UI_COPY.productionStatusLabels.published, color: 'bg-emerald-600', icon: CheckCircle2 },
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

function getNextAction(prod: Production): string {
    if (prod.status === 'scripting') {
        return prod.script_status === 'draft'
            ? UI_COPY.nextActionLabels.scripting
            : UI_COPY.pendingActionTitles.script;
    }
    return UI_COPY.nextActionLabels[prod.status] || UI_COPY.nextActionLabels.idea;
}

export default function ProductionsList({ productions, onProductionClick }: ProductionsListProps) {
    return (
        <motion.div
            className="surface-card glow-hover overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/60">
                <span className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">{UI_COPY.dashboard.sections.active}</span>
            </div>

            {/* Productions list */}
            <motion.div
                className="divide-y divide-gray-800/50"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {productions.length === 0 ? (
                    <motion.div
                        className="px-5 py-6 text-center hover:bg-gray-800/40 transition-colors"
                        variants={itemVariants}
                        whileHover={{ scale: 1.01 }}
                    >
                        <span className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-900/70 border border-gray-800 flex items-center justify-center text-yellow-400">
                            <Film className="w-6 h-6" />
                        </span>
                        <span className="text-base text-slate-300 block mb-1">{UI_COPY.productions.emptyTitle}</span>
                        <span className="text-sm text-slate-400">{UI_COPY.productions.emptyDescription}</span>
                    </motion.div>
                ) : (
                    productions.slice(0, 6).map((prod) => {
                        const badge = STATUS_BADGE[prod.status];
                        const Icon = badge.icon;
                        const nextAction = getNextAction(prod);

                        return (
                            <motion.button
                                key={prod.id}
                                type="button"
                                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/40 cursor-pointer transition-colors group w-full text-left"
                                onClick={() => onProductionClick?.(prod)}
                                variants={itemVariants}
                                whileHover={{ x: 4 }}
                                aria-label={`${UI_COPY.productions.openLabel} ${prod.title}`}
                            >
                                {/* Status badge with icon */}
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                                        <Icon className="w-4 h-4" />
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded-md ${badge.color} text-white font-medium`}>
                                        {badge.label}
                                    </span>
                                </div>

                                {/* Title */}
                                <div className="flex-1 min-w-0">
                                    <span className="text-base font-medium text-white truncate block">{prod.title}</span>
                                    <span className="text-sm text-slate-400 truncate block">{nextAction}</span>
                                </div>

                                {/* Arrow */}
                                <motion.span
                                    className="text-gray-600 group-hover:text-yellow-400 transition-colors text-lg"
                                    initial={{ x: 0 }}
                                    whileHover={{ x: 3 }}
                                >
                                    →
                                </motion.span>
                            </motion.button>
                        );
                    })
                )}
            </motion.div>
        </motion.div>
    );
}
