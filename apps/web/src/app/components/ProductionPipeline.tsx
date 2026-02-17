'use client';

import { motion } from 'framer-motion';
import {
    CheckCircle2,
    FileText,
    Lightbulb,
    Smartphone,
    Scissors,
    Upload,
    Video,
} from 'lucide-react';

interface PipelineStats {
    idea: number;
    scripting: number;
    recording: number;
    editing: number;
    shorts: number;
    publishing: number;
    published: number;
}

interface ProductionPipelineProps {
    stats: PipelineStats;
    onStageClick?: (stage: keyof PipelineStats) => void;
}

const STAGES: { key: keyof PipelineStats; icon: typeof Lightbulb; label: string; color: string; bgColor: string }[] = [
    { key: 'idea', icon: Lightbulb, label: 'Ideas', color: 'text-slate-300', bgColor: 'bg-slate-700' },
    { key: 'scripting', icon: FileText, label: 'Guion', color: 'text-blue-300', bgColor: 'bg-blue-500' },
    { key: 'recording', icon: Video, label: 'Grabacion', color: 'text-purple-300', bgColor: 'bg-purple-500' },
    { key: 'editing', icon: Scissors, label: 'Edicion', color: 'text-orange-300', bgColor: 'bg-orange-500' },
    { key: 'shorts', icon: Smartphone, label: 'Shorts', color: 'text-cyan-300', bgColor: 'bg-cyan-500' },
    { key: 'publishing', icon: Upload, label: 'Publicar', color: 'text-yellow-300', bgColor: 'bg-yellow-500' },
    { key: 'published', icon: CheckCircle2, label: 'Publicado', color: 'text-emerald-300', bgColor: 'bg-emerald-500' },
];

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

export default function ProductionPipeline({ stats, onStageClick }: ProductionPipelineProps) {
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
                <span className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">Pipeline de produccion</span>
                <span className="text-xs text-slate-400">{total} contenidos</span>
            </div>

            {/* Pipeline Container - Responsive Grid/Flex */}
            <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 md:flex md:items-stretch gap-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {STAGES.map((stage, index) => {
                    const count = stats[stage.key] || 0;
                    const hasItems = count > 0;

                    return (
                        <motion.button
                            key={stage.key}
                            onClick={() => hasItems && onStageClick?.(stage.key)}
                            className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl transition-all ${hasItems
                                ? 'bg-gray-800/70 hover:bg-gray-800 cursor-pointer shadow-lg'
                                : 'bg-gray-900/40 cursor-default'
                                } ${
                                // Make last item span full width on odd grid counts if needed, 
                                // but specifically for 7 items on 2-col grid, the last one is alone.
                                index === STAGES.length - 1 ? 'col-span-2 sm:col-span-1 md:flex-1' : 'md:flex-1'
                                }`}
                            variants={itemVariants}
                            whileHover={hasItems ? { scale: 1.03, y: -2 } : {}}
                            whileTap={hasItems ? { scale: 0.97 } : {}}
                        >
                            {/* Icon */}
                            <stage.icon className="w-6 h-6 mb-2 text-slate-200" />

                            {/* Counter badge */}
                            <motion.div
                                className={`w-10 h-10 rounded-full ${stage.bgColor} flex items-center justify-center mb-2 shadow-lg`}
                                animate={hasItems ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ repeat: hasItems ? Infinity : 0, duration: 2, repeatDelay: 3 }}
                            >
                                <span className="text-lg font-bold text-white">{count}</span>
                            </motion.div>

                            {/* Label */}
                            <span className={`text-sm font-medium ${hasItems ? stage.color : 'text-gray-600'}`}>
                                {stage.label}
                            </span>
                        </motion.button>
                    );
                })}
            </motion.div>

            {/* Flow indicator - Only visible on desktop */}
            <div className="hidden md:flex items-center justify-center gap-1 mt-4 text-gray-600">
                {STAGES.map((stage, i) => (
                    <span key={stage.key} className="flex items-center">
                        <stage.icon className="w-4 h-4 text-slate-500" />
                        {i < STAGES.length - 1 && <span className="text-sm mx-1 text-slate-600">→</span>}
                    </span>
                ))}
            </div>
        </motion.div>
    );
}
