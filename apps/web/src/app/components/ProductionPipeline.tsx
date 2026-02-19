'use client';

import { motion } from 'framer-motion';
import type { PipelineStage, PipelineStats } from '@/domain/types';
import { UI_COPY } from '@/config/uiCopy';
import { PIPELINE_STAGE_CONFIGS } from '@/domain/configs/pipeline';

interface ProductionPipelineProps {
    stats: PipelineStats;
    onStageClick?: (stage: PipelineStage) => void;
    activeStage?: PipelineStage | null;
}

const STAGE_COLORS: Record<PipelineStage, { color: string; bgColor: string }> = {
    idea: { color: 'text-slate-300', bgColor: 'bg-slate-700' },
    scripting: { color: 'text-blue-300', bgColor: 'bg-blue-500' },
    recording: { color: 'text-purple-300', bgColor: 'bg-purple-500' },
    editing: { color: 'text-orange-300', bgColor: 'bg-orange-500' },
    shorts: { color: 'text-cyan-300', bgColor: 'bg-cyan-500' },
    publishing: { color: 'text-yellow-300', bgColor: 'bg-yellow-500' },
    published: { color: 'text-emerald-300', bgColor: 'bg-emerald-500' },
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

export default function ProductionPipeline({ stats, onStageClick, activeStage }: ProductionPipelineProps) {
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);

    return (
        <motion.div
            className="surface-card glow-hover p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">{UI_COPY.dashboard.sections.pipeline}</span>
                <span className="text-xs text-slate-400">{total} {UI_COPY.pipeline.totalLabel}</span>
            </div>

            {/* Pipeline Container - Responsive Grid/Flex */}
            <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 md:flex md:items-stretch gap-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {PIPELINE_STAGE_CONFIGS.map((stage, index) => {
                    const stageColors = STAGE_COLORS[stage.id];
                    const count = stats[stage.id] || 0;
                    const hasItems = count > 0;
                    const canClick = Boolean(onStageClick);
                    const isActive = activeStage === stage.id;

                    return (
                        <motion.button
                            key={stage.id}
                            onClick={() => onStageClick?.(stage.id)}
                            className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl transition-all ${hasItems
                                ? 'bg-gray-800/70 hover:bg-gray-800 shadow-lg'
                                : 'bg-gray-900/40'} ${isActive ? 'ring-1 ring-yellow-400/60' : ''} ${
                                // Make last item span full width on odd grid counts if needed, 
                                // but specifically for 7 items on 2-col grid, the last one is alone.
                                index === PIPELINE_STAGE_CONFIGS.length - 1 ? 'col-span-2 sm:col-span-1 md:flex-1' : 'md:flex-1'
                                } ${canClick ? 'cursor-pointer' : 'cursor-default'}`}
                            aria-disabled={!canClick}
                            aria-pressed={isActive}
                            variants={itemVariants}
                            whileHover={canClick ? { scale: 1.03, y: -2 } : {}}
                            whileTap={canClick ? { scale: 0.97 } : {}}
                        >
                            {/* Icon */}
                            <stage.icon className="w-6 h-6 mb-2 text-slate-200" />

                            {/* Counter badge */}
                            <motion.div
                                className={`w-10 h-10 rounded-full ${stageColors.bgColor} flex items-center justify-center mb-2 shadow-lg`}
                                animate={hasItems ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ repeat: hasItems ? Infinity : 0, duration: 2, repeatDelay: 3 }}
                            >
                                <span className="text-lg font-bold text-white">{count}</span>
                            </motion.div>

                            {/* Label */}
                            <span className={`text-sm font-medium ${hasItems ? stageColors.color : 'text-gray-600'}`}>
                                {stage.label}
                            </span>
                        </motion.button>
                    );
                })}
            </motion.div>

            {/* Flow indicator - Only visible on desktop */}
            <div className="hidden md:flex items-center justify-center gap-1 mt-4 text-gray-600">
                {PIPELINE_STAGE_CONFIGS.map((stage, i) => (
                    <span key={stage.id} className="flex items-center">
                        <stage.icon className="w-4 h-4 text-slate-500" />
                        {i < PIPELINE_STAGE_CONFIGS.length - 1 && <span className="text-sm mx-1 text-slate-600">→</span>}
                    </span>
                ))}
            </div>
        </motion.div>
    );
}
