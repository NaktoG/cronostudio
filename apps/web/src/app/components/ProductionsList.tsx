'use client';

import { motion } from 'framer-motion';

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
}

const STATUS_BADGE: Record<string, { label: string; color: string; icon: string }> = {
    idea: { label: 'Idea', color: 'bg-gray-600', icon: '💡' },
    scripting: { label: 'Guión', color: 'bg-blue-600', icon: '📝' },
    recording: { label: 'Grabando', color: 'bg-purple-600', icon: '🎬' },
    editing: { label: 'Editando', color: 'bg-orange-600', icon: '✂️' },
    shorts: { label: 'Shorts', color: 'bg-cyan-600', icon: '📱' },
    publishing: { label: 'Publicando', color: 'bg-yellow-600', icon: '📤' },
    published: { label: 'Publicado', color: 'bg-green-600', icon: '✅' },
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
    if (prod.status === 'idea') return 'Empezar guión';
    if (prod.status === 'scripting') return prod.script_status === 'draft' ? 'Continuar guión' : 'Revisar guión';
    if (prod.status === 'recording') return 'Subir grabación';
    if (prod.status === 'editing') return 'Terminar edición';
    if (prod.status === 'shorts') return `Crear shorts`;
    if (prod.status === 'publishing') return 'Programar publicación';
    return 'Ver detalles';
}

export default function ProductionsList({ productions, onProductionClick, onCreateNew }: ProductionsListProps) {
    return (
        <motion.div
            className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/60">
                <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">📦 Contenidos Activos</span>
                <motion.button
                    onClick={onCreateNew}
                    className="text-sm text-yellow-400 hover:text-yellow-300 font-semibold flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    + Nuevo
                </motion.button>
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
                        className="px-5 py-6 text-center cursor-pointer hover:bg-gray-800/40 transition-colors"
                        onClick={onCreateNew}
                        variants={itemVariants}
                        whileHover={{ scale: 1.01 }}
                    >
                        <span className="text-4xl block mb-3">🎬</span>
                        <span className="text-base text-gray-400 block mb-1">Sin contenidos activos</span>
                        <span className="text-base text-yellow-400 hover:underline font-medium">Crear tu primer contenido →</span>
                    </motion.div>
                ) : (
                    productions.slice(0, 6).map((prod) => {
                        const badge = STATUS_BADGE[prod.status] || STATUS_BADGE.idea;
                        const nextAction = getNextAction(prod);

                        return (
                            <motion.div
                                key={prod.id}
                                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/40 cursor-pointer transition-colors group"
                                onClick={() => onProductionClick?.(prod)}
                                variants={itemVariants}
                                whileHover={{ x: 4 }}
                            >
                                {/* Status badge with icon */}
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{badge.icon}</span>
                                    <span className={`text-xs px-2 py-1 rounded-md ${badge.color} text-white font-medium`}>
                                        {badge.label}
                                    </span>
                                </div>

                                {/* Title */}
                                <div className="flex-1 min-w-0">
                                    <span className="text-base font-medium text-white truncate block">{prod.title}</span>
                                    <span className="text-sm text-gray-500 truncate block">{nextAction}</span>
                                </div>

                                {/* Arrow */}
                                <motion.span
                                    className="text-gray-600 group-hover:text-yellow-400 transition-colors text-lg"
                                    initial={{ x: 0 }}
                                    whileHover={{ x: 3 }}
                                >
                                    →
                                </motion.span>
                            </motion.div>
                        );
                    })
                )}
            </motion.div>
        </motion.div>
    );
}
