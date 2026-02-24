'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, FileText, Film, Lightbulb, Smartphone, Scissors, Upload, Video } from 'lucide-react';
import { COMPONENT_COPY } from '../content/components';
import { NEXT_ACTION_LABELS, PRODUCTION_STATUS_BADGES } from '../content/labels';

export interface Production {
    id: string;
    title: string;
    status: string;
    channel_name?: string;
    script_status?: string;
    thumbnail_status?: string;
    seo_score?: number;
    shorts_count: number;
    shorts_published: number;
    posts_count: number;
    posts_published: number;
    target_date?: string;
    updated_at: string;
}

interface ProductionsListProps {
    productions: Production[];
    onProductionClick?: (production: Production) => void;
    onCreateNew?: () => void;
    title?: string;
    filterLabel?: string | null;
    onClearFilter?: () => void;
    showCreateButton?: boolean;
}

const STATUS_BADGE: Record<string, { label: string; color: string; icon: typeof Lightbulb }> = {
    idea: { label: PRODUCTION_STATUS_BADGES.idea, color: 'bg-slate-600', icon: Lightbulb },
    scripting: { label: PRODUCTION_STATUS_BADGES.scripting, color: 'bg-blue-600', icon: FileText },
    recording: { label: PRODUCTION_STATUS_BADGES.recording, color: 'bg-purple-600', icon: Video },
    editing: { label: PRODUCTION_STATUS_BADGES.editing, color: 'bg-orange-600', icon: Scissors },
    shorts: { label: PRODUCTION_STATUS_BADGES.shorts, color: 'bg-cyan-600', icon: Smartphone },
    publishing: { label: PRODUCTION_STATUS_BADGES.publishing, color: 'bg-yellow-600', icon: Upload },
    published: { label: PRODUCTION_STATUS_BADGES.published, color: 'bg-emerald-600', icon: CheckCircle2 },
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
    if (prod.status === 'scripting') return prod.script_status === 'draft' ? NEXT_ACTION_LABELS.scripting : COMPONENT_COPY.productionsList.reviewScript;
    if (prod.status in NEXT_ACTION_LABELS) {
        return NEXT_ACTION_LABELS[prod.status as keyof typeof NEXT_ACTION_LABELS];
    }
    return NEXT_ACTION_LABELS.published;
}

export default function ProductionsList({
    productions,
    onProductionClick,
    onCreateNew,
    title = 'Contenidos activos',
    filterLabel,
    onClearFilter,
    showCreateButton = true,
}: ProductionsListProps) {
    return (
        <motion.div
            className="surface-card glow-hover overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/60">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <span className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">{title}</span>
                    {filterLabel && (
                        <button
                            type="button"
                            onClick={onClearFilter}
                            className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-300 hover:border-yellow-400/60"
                        >
                            {filterLabel}
                            <span aria-hidden="true">×</span>
                        </button>
                    )}
                </div>
                {showCreateButton && (
                    <motion.button
                        onClick={onCreateNew}
                        className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold flex items-center gap-1"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {COMPONENT_COPY.productionsList.new}
                    </motion.button>
                )}
            </div>

            {/* Productions list */}
            <motion.div
                className="divide-y divide-gray-800/50"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {productions.length === 0 ? (
                    <motion.button
                        type="button"
                        className="w-full px-5 py-6 text-center cursor-pointer hover:bg-gray-800/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60"
                        onClick={filterLabel && onClearFilter ? onClearFilter : showCreateButton ? onCreateNew : undefined}
                        aria-label="Crear nuevo contenido"
                        variants={itemVariants}
                        whileHover={{ scale: 1.01 }}
                    >
                        <span className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-900/70 border border-gray-800 flex items-center justify-center text-yellow-400">
                            <Film className="w-6 h-6" />
                        </span>
                        <span className="text-base text-slate-300 block mb-1">
                            {filterLabel ? COMPONENT_COPY.productionsList.emptyStage : COMPONENT_COPY.productionsList.emptyActive}
                        </span>
                        {showCreateButton && (
                            <span className="text-sm text-yellow-400 hover:underline font-semibold">
                                {filterLabel ? COMPONENT_COPY.productionsList.changeFilter : COMPONENT_COPY.productionsList.createFirst}
                            </span>
                        )}
                    </motion.button>
                ) : (
                    productions.slice(0, 6).map((prod) => {
                        const badge = STATUS_BADGE[prod.status] || STATUS_BADGE.idea;
                        const Icon = badge.icon;
                        const nextAction = getNextAction(prod);

                        return (
                            <motion.button
                                key={prod.id}
                                type="button"
                                className="flex w-full flex-col gap-4 px-5 py-4 text-left hover:bg-gray-800/40 cursor-pointer transition-colors group sm:flex-row sm:items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60"
                                onClick={() => onProductionClick?.(prod)}
                                aria-label={`Abrir contenido ${prod.title}`}
                                variants={itemVariants}
                                whileHover={{ x: 4 }}
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
                                    className="text-gray-600 group-hover:text-yellow-400 transition-colors text-lg sm:ml-auto"
                                    initial={{ x: 0 }}
                                    whileHover={{ x: 3 }}
                                    aria-hidden="true"
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
