'use client';

import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

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

interface ProductionCardProps {
    production: Production;
    onClick?: (production: Production) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    idea: { label: 'Idea', color: 'text-gray-400', bg: 'bg-gray-500/20' },
    scripting: { label: 'En guión', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    recording: { label: 'Grabando', color: 'text-purple-400', bg: 'bg-purple-500/20' },
    editing: { label: 'Editando', color: 'text-orange-400', bg: 'bg-orange-500/20' },
    shorts: { label: 'Shorts', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
    publishing: { label: 'Publicando', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    published: { label: 'Publicado', color: 'text-green-400', bg: 'bg-green-500/20' },
};

function getProgress(production: Production): { label: string; percent: number; status: 'done' | 'pending' | 'none' }[] {
    return [
        {
            label: 'Guión',
            percent: production.script_status === 'approved' || production.script_status === 'recorded' ? 100 :
                production.script_status === 'review' ? 80 :
                    production.script_status === 'draft' ? 40 : 0,
            status: production.script_status ? (production.script_status === 'approved' || production.script_status === 'recorded' ? 'done' : 'pending') : 'none'
        },
        {
            label: 'Miniatura',
            percent: production.thumbnail_status === 'approved' ? 100 :
                production.thumbnail_status === 'designed' ? 70 :
                    production.thumbnail_status === 'designing' ? 40 : 0,
            status: production.thumbnail_status ? (production.thumbnail_status === 'approved' ? 'done' : 'pending') : 'none'
        },
        {
            label: 'SEO',
            percent: production.seo_score || 0,
            status: production.seo_score ? (production.seo_score >= 80 ? 'done' : 'pending') : 'none'
        },
        {
            label: 'Shorts',
            percent: production.shorts_count > 0 ? (production.shorts_published / production.shorts_count) * 100 : 0,
            status: production.shorts_count > 0 ? (production.shorts_published === production.shorts_count ? 'done' : 'pending') : 'none'
        },
    ];
}

export default function ProductionCard({ production, onClick }: ProductionCardProps) {
    const statusConfig = STATUS_CONFIG[production.status] || STATUS_CONFIG.idea;
    const progress = getProgress(production);

    return (
        <motion.div
            className="surface-panel glow-hover p-4 cursor-pointer"
            onClick={() => onClick?.(production)}
            whileHover={{ x: 4 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold truncate">{production.title}</h4>
                    {production.channel_name && (
                        <p className="text-xs text-gray-500">{production.channel_name}</p>
                    )}
                </div>
                <span className={`${statusConfig.bg} ${statusConfig.color} text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ml-2`}>
                    {statusConfig.label}
                </span>
            </div>

            {/* Progress Items */}
            <div className="space-y-2">
                {progress.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.status === 'done' ? 'bg-green-500' :
                                item.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-700'
                            }`} />
                        <span className="text-xs text-gray-400 w-16">{item.label}</span>
                        <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full ${item.status === 'done' ? 'bg-green-500' :
                                        item.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-700'
                                    }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percent}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        {item.label === 'Shorts' && production.shorts_count > 0 && (
                            <span className="text-xs text-gray-500">
                                {production.shorts_published}/{production.shorts_count}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                {production.target_date && (
                    <span className="text-xs text-gray-500 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(production.target_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                )}
                <Link
                    href={`/productions/${production.id}`}
                    className="text-xs text-yellow-400 hover:text-yellow-300 font-medium ml-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    Ver detalle →
                </Link>
            </div>
        </motion.div>
    );
}
