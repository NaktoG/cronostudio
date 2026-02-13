'use client';

import { motion } from 'framer-motion';

interface PriorityAction {
    id: string;
    type: 'script' | 'seo' | 'thumbnail' | 'short' | 'publish';
    title: string;
    productionTitle: string;
    productionId: string;
    urgency: 'high' | 'medium' | 'low';
}

interface PriorityActionsProps {
    actions: PriorityAction[];
    onActionClick?: (action: PriorityAction) => void;
    onCreateNew?: () => void;
}

const ACTION_ICONS: Record<string, string> = {
    script: '📝',
    seo: '🔍',
    thumbnail: '🖼️',
    short: '✂️',
    publish: '📤',
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

export default function PriorityActions({ actions, onActionClick, onCreateNew }: PriorityActionsProps) {
    const displayActions = [...actions];

    if (displayActions.length === 0) {
        displayActions.push(
            { id: 'new-1', type: 'script', title: 'Crear nuevo contenido', productionTitle: 'Empieza aquí', productionId: '', urgency: 'low' as const },
        );
    }

    return (
        <motion.div
            className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/60">
                <span className="text-sm font-semibold text-slate-200 uppercase tracking-wider">🎯 Acciones Pendientes</span>
                <span className="text-sm text-slate-300">{actions.length} items</span>
            </div>

            {/* Action list */}
            <motion.div
                className="divide-y divide-gray-800/50"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {displayActions.slice(0, 5).map((action) => {
                    const styles = URGENCY_STYLES[action.urgency];

                    return (
                        <motion.div
                            key={action.id}
                            className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-800/40 cursor-pointer transition-colors group ${styles.bg}`}
                            onClick={() => action.productionId ? onActionClick?.(action) : onCreateNew?.()}
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
                            <span className="text-xl flex-shrink-0">{ACTION_ICONS[action.type]}</span>

                            {/* Action text */}
                            <div className="flex-1 min-w-0">
                                <span className="text-base font-medium text-white block truncate">{action.title}</span>
                                <span className="text-sm text-slate-300 truncate block">{action.productionTitle}</span>
                            </div>

                            {/* Action button */}
                            <motion.span
                                className="text-sm text-yellow-400 opacity-0 group-hover:opacity-100 font-medium flex items-center gap-1"
                                initial={{ x: -10 }}
                                whileHover={{ x: 0 }}
                            >
                                Ir <span>→</span>
                            </motion.span>
                        </motion.div>
                    );
                })}

                {/* Empty state */}
                {actions.length === 0 && (
                    <motion.div
                        className="flex items-center gap-4 px-5 py-4 text-slate-200 hover:bg-gray-800/40 cursor-pointer"
                        onClick={onCreateNew}
                        variants={itemVariants}
                        whileHover={{ x: 4 }}
                    >
                        <span className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-xl">✓</span>
                        <div className="flex-1">
                            <span className="text-base text-slate-100">¡Todo al día!</span>
                            <span className="text-sm text-yellow-400 block hover:underline">Crear nuevo contenido</span>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
}
