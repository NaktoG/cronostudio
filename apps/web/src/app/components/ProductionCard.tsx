'use client';

import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatDayMonth } from '@/lib/dates';
import { useLocale } from '../contexts/LocaleContext';
import { getComponentsCopy } from '../content/components';

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
    scripting: { label: 'Scripting', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    recording: { label: 'Recording', color: 'text-purple-400', bg: 'bg-purple-500/20' },
    editing: { label: 'Editing', color: 'text-orange-400', bg: 'bg-orange-500/20' },
    shorts: { label: 'Shorts', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
    publishing: { label: 'Publishing', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    published: { label: 'Published', color: 'text-green-400', bg: 'bg-green-500/20' },
};

function getProgress(production: Production): { label: 'script' | 'thumbnail' | 'seo' | 'shorts'; percent: number; status: 'done' | 'pending' | 'none' }[] {
    return [
      {
            label: 'script',
            percent: production.script_status === 'approved' || production.script_status === 'recorded' ? 100 :
                production.script_status === 'review' ? 80 :
                    production.script_status === 'draft' ? 40 : 0,
            status: production.script_status ? (production.script_status === 'approved' || production.script_status === 'recorded' ? 'done' : 'pending') : 'none'
        },
        {
            label: 'thumbnail',
            percent: production.thumbnail_status === 'approved' ? 100 :
                production.thumbnail_status === 'designed' ? 70 :
                    production.thumbnail_status === 'designing' ? 40 : 0,
            status: production.thumbnail_status ? (production.thumbnail_status === 'approved' ? 'done' : 'pending') : 'none'
        },
        {
            label: 'seo',
            percent: production.seo_score || 0,
            status: production.seo_score ? (production.seo_score >= 80 ? 'done' : 'pending') : 'none'
        },
        {
            label: 'shorts',
            percent: production.shorts_count > 0 ? (production.shorts_published / production.shorts_count) * 100 : 0,
            status: production.shorts_count > 0 ? (production.shorts_published === production.shorts_count ? 'done' : 'pending') : 'none'
        },
    ];
}

export default function ProductionCard({ production, onClick }: ProductionCardProps) {
    const { locale } = useLocale();
    const componentsCopy = getComponentsCopy(locale);
    const statusConfigLocalized: typeof STATUS_CONFIG = {
        idea: { ...STATUS_CONFIG.idea, label: componentsCopy.productionCard.labels.idea },
        scripting: { ...STATUS_CONFIG.scripting, label: componentsCopy.productionCard.labels.scripting },
        recording: { ...STATUS_CONFIG.recording, label: componentsCopy.productionCard.labels.recording },
        editing: { ...STATUS_CONFIG.editing, label: componentsCopy.productionCard.labels.editing },
        shorts: { ...STATUS_CONFIG.shorts, label: componentsCopy.productionCard.labels.shorts },
        publishing: { ...STATUS_CONFIG.publishing, label: componentsCopy.productionCard.labels.publishing },
        published: { ...STATUS_CONFIG.published, label: componentsCopy.productionCard.labels.published },
    };
    const statusConfig = statusConfigLocalized[production.status] || statusConfigLocalized.idea;
    const progress = getProgress(production);

    return (
        <motion.button
            type="button"
            className="surface-panel glow-hover w-full p-4 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60"
            onClick={() => onClick?.(production)}
            aria-label={`${componentsCopy.productionCard.openProduction} ${production.title}`}
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
                        <span className="text-xs text-gray-400 w-16">{item.label === 'script' ? componentsCopy.productionCard.progress.script : item.label === 'thumbnail' ? componentsCopy.productionCard.progress.thumbnail : item.label === 'seo' ? componentsCopy.productionCard.progress.seo : componentsCopy.productionCard.progress.shorts}</span>
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
                        {item.label === 'shorts' && production.shorts_count > 0 && (
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
                        {formatDayMonth(production.target_date)}
                    </span>
                )}
                <Link
                    href={`/productions/${production.id}`}
                    className="text-xs text-yellow-400 hover:text-yellow-300 font-medium ml-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {componentsCopy.productionCard.detail}
                </Link>
            </div>
        </motion.button>
    );
}
