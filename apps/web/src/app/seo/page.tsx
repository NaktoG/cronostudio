'use client';

import { useState } from 'react';
import { Lightbulb, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import BackToDashboard from '../components/BackToDashboard';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLocale } from '../contexts/LocaleContext';
import { getSeoCopy } from '../content/pages/seo';
import { SEO_SCORE_THRESHOLDS, getSeoScoreLabel, getSeoScoreLabels } from '@/app/content/status/seo';
import { useRouter } from 'next/navigation';
import { useChannels } from '@/app/hooks/useChannels';
import { useSeoData } from '@/app/seo/hooks/useSeoData';
import { copyToClipboard } from '@/lib/clipboard';

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
}

export default function SeoPage() {
    const { isAuthenticated } = useAuth();
    const { locale } = useLocale();
    const seoCopy = getSeoCopy(locale);
    const scoreLabels = getSeoScoreLabels(locale);
    const authFetch = useAuthFetch();
    const { addToast } = useToast();
    const router = useRouter();
    const { channels } = useChannels({ isAuthenticated, authFetch });
    const { state, actions } = useSeoData({ isAuthenticated, authFetch, addToast, seoCopy });
    const { seoData, loading, error, selectedChannel, selectedIds, ideaOptions, scriptOptions } = state;
    const { setSelectedChannel, refreshSeo, toggleSelection, clearSelection, copySelected, copyItem } = actions;
    const [showPresets, setShowPresets] = useState(false);
    const handlePresetCopy = async (value: string) => {
        try {
            await copyToClipboard(value);
            addToast(seoCopy.toasts.copied, 'success');
        } catch {
            addToast(seoCopy.toasts.error, 'error');
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= SEO_SCORE_THRESHOLDS.excellent) return 'text-green-400';
        if (score >= SEO_SCORE_THRESHOLDS.good) return 'text-yellow-400';
        if (score >= SEO_SCORE_THRESHOLDS.ok) return 'text-orange-400';
        return 'text-red-400';
    };

    const getScoreLabel = (score: number) => {
        const labelKey = getSeoScoreLabel(score);
        return scoreLabels[labelKey];
    };

    const normalizeTitles = (titles?: Array<string | { title?: string }>) =>
        Array.isArray(titles)
            ? titles.map((item) => (typeof item === 'string' ? item : item.title)).filter(isNonEmptyString)
            : [];

    const normalizeThumbs = (thumbs?: Array<string | { text?: string }>, fallback?: string[]) => {
        if (Array.isArray(fallback) && fallback.length > 0) return fallback.filter(isNonEmptyString);
        return Array.isArray(thumbs)
            ? thumbs.map((item) => (typeof item === 'string' ? item : item.text)).filter(isNonEmptyString)
            : [];
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
                    <h1 className="sr-only">{seoCopy.title}</h1>
                    <motion.div
                        className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-start sm:justify-between"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div>
                            <BackToDashboard />
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-10 h-10 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                                    <Search className="w-5 h-5" />
                                </span>
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">{seoCopy.title}</h2>
                            </div>
                            <p className="text-sm sm:text-base text-slate-300">{seoCopy.subtitle}</p>
                        </div>
                        {channels.length > 0 && (
                            <div className="min-w-[220px]">
                                <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">{seoCopy.controls.channel}</label>
                                <select
                                    value={selectedChannel}
                                    onChange={(event) => {
                                        const next = event.target.value;
                                        setSelectedChannel(next);
                                        if (typeof window !== 'undefined') {
                                            window.localStorage.setItem('cronostudio.channelId', next);
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 bg-gray-900/70 border border-gray-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-yellow-400"
                                >
                                    <option value="">{seoCopy.controls.allChannels}</option>
                                    {channels.map((channel) => (
                                        <option key={channel.id} value={channel.id}>
                                            {channel.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {selectedIds.length > 0 && (
                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                                <span className="text-xs text-slate-400">{selectedIds.length} {seoCopy.controls.selectedCount}</span>
                                <button
                                    type="button"
                                    onClick={() => copySelected('title')}
                                    className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                                >
                                    {seoCopy.controls.copyTitles}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => copySelected('description')}
                                    className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                                >
                                    {seoCopy.controls.copyDescriptions}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => copySelected('tags')}
                                    className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                                >
                                    {seoCopy.controls.copyTags}
                                </button>
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                                >
                                    {seoCopy.controls.clear}
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Tips Card */}
                    <motion.div
                        className="surface-panel glow-hover p-4 sm:p-6 mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h3 className="text-lg font-semibold text-teal-300 mb-3 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            {seoCopy.tipsTitle}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                            {seoCopy.tips.map((tip) => (
                                <div key={tip.title}>
                                    <p className="text-white font-medium mb-1">{tip.title}</p>
                                    <p className="text-gray-400">{tip.description}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <motion.div
                            className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <span>{error}</span>
                                <button
                                    type="button"
                                    onClick={() => refreshSeo()}
                                    className="text-xs font-semibold text-yellow-300 hover:text-yellow-200"
                                >
                                    {seoCopy.controls.retry}
                                </button>
                            </div>
                        </motion.div>
                    ) : seoData.length === 0 ? (
                        <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-900/60 border border-gray-800 rounded-full flex items-center justify-center text-yellow-400">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{seoCopy.emptyTitle}</h3>
                            <p className="text-slate-300 mb-2">{seoCopy.emptySubtitle}</p>
                            <p className="text-slate-500 text-sm">{seoCopy.emptyHint}</p>
                            <motion.div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                                <motion.button
                                    onClick={() => router.push('/channels')}
                                    className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {seoCopy.connectChannel}
                                </motion.button>
                                <motion.button
                                    onClick={() => router.push('/analytics')}
                                    className="px-6 py-3 border border-gray-700 text-gray-200 rounded-lg hover:bg-gray-800"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {seoCopy.viewAnalytics}
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <datalist id="seo-idea-options">
                                {ideaOptions.map((idea) => (
                                    <option key={idea.id} value={idea.id}>{idea.title}</option>
                                ))}
                            </datalist>
                            <datalist id="seo-script-options">
                                {scriptOptions.map((script) => (
                                    <option key={script.id} value={script.id}>{script.title}</option>
                                ))}
                            </datalist>
                            {seoData.map((item, index) => (
                            <motion.div
                                key={item.id}
                                className={`surface-panel glow-hover p-6 transition-all min-w-0 ${selectedIds.includes(item.id) ? 'ring-2 ring-yellow-400/60' : ''}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(item.id)}
                                                    onChange={() => toggleSelection(item.id)}
                                                    aria-label={`${seoCopy.controls.selectPrefix} ${item.optimized_title}`}
                                                    className="h-4 w-4 rounded border-gray-700 text-yellow-400 focus:ring-yellow-400"
                                                />
                                                {seoCopy.controls.select}
                                            </label>
                                            <h3 className="text-lg font-semibold text-white break-words">
                                                {item.optimized_title}
                                            </h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <button
                                                type="button"
                                                onClick={() => copyItem(item, 'title')}
                                                className="text-[11px] px-2 py-1 rounded-full border border-gray-800 text-slate-300 hover:text-white"
                                            >
                                                {seoCopy.controls.copyTitle}
                                            </button>
                                            {item.description && (
                                                <button
                                                    type="button"
                                                    onClick={() => copyItem(item, 'description')}
                                                    className="text-[11px] px-2 py-1 rounded-full border border-gray-800 text-slate-300 hover:text-white"
                                                >
                                                    {seoCopy.controls.copyDescription}
                                                </button>
                                            )}
                                            {item.tags?.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => copyItem(item, 'tags')}
                                                    className="text-[11px] px-2 py-1 rounded-full border border-gray-800 text-slate-300 hover:text-white"
                                                >
                                                    {seoCopy.controls.copyTagsSingle}
                                                </button>
                                            )}
                                        </div>
                                            {item.video_title && (
                                                <p className="text-sm text-gray-500">{seoCopy.videoPrefix} {item.video_title}</p>
                                            )}
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <input
                                                    type="text"
                                                    list="seo-idea-options"
                                                    placeholder={seoCopy.controls.ideaIdPlaceholder}
                                                    className="w-40 rounded-lg border border-gray-800 bg-gray-900/70 px-3 py-2 text-xs text-slate-200"
                                                />
                                                <input
                                                    type="text"
                                                    list="seo-script-options"
                                                    placeholder={seoCopy.controls.scriptIdPlaceholder}
                                                    className="w-40 rounded-lg border border-gray-800 bg-gray-900/70 px-3 py-2 text-xs text-slate-200"
                                                />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-3xl font-bold ${getScoreColor(item.score)}`}>
                                                {item.score}
                                            </div>
                                            <p className={`text-xs ${getScoreColor(item.score)}`}>
                                                {getScoreLabel(item.score)}
                                            </p>
                                        </div>
                                    </div>

                                    {item.description && (
                                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{item.description}</p>
                                    )}

                                    {item.tags && item.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {item.tags.slice(0, 8).map((tag, i) => (
                                                <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                                                    #{tag}
                                                </span>
                                            ))}
                                            {item.tags.length > 8 && (
                                                <span className="text-xs text-gray-500">
                                                    +{item.tags.length - 8} {seoCopy.controls.moreSuffix}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {(() => {
                                        const suggestionTitles = normalizeTitles(item.suggestions?.titles);
                                        const suggestionThumbs = normalizeThumbs(item.suggestions?.thumbnails, item.suggestions?.thumbnailTexts);
                                        if (suggestionTitles.length === 0 && suggestionThumbs.length === 0) return null;
                                        return (
                                        <div className="mt-2 rounded-lg border border-gray-800 bg-gray-900/60 p-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowPresets((current) => !current)}
                                                className="text-xs uppercase tracking-[0.2em] text-yellow-300"
                                            >
                                                {showPresets ? seoCopy.presets.hide : seoCopy.presets.show}
                                            </button>
                                            {showPresets && (
                                                <div className="mt-3 space-y-3">
                                                    {suggestionTitles.length ? (
                                                        <div>
                                                            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{seoCopy.presets.suggestedTitles}</div>
                                                            <div className="mt-2 flex flex-col gap-2">
                                                                {suggestionTitles.slice(0, 6).map((title) => (
                                                                    <button
                                                                        key={title}
                                                                        type="button"
                                                                        onClick={() => handlePresetCopy(title)}
                                                                        className="text-left text-xs text-slate-200 rounded-lg border border-gray-800 px-3 py-2 hover:border-yellow-400/50"
                                                                    >
                                                                        {title}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                    {suggestionThumbs.length ? (
                                                        <div>
                                                            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{seoCopy.presets.thumbnailTexts}</div>
                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                {suggestionThumbs.slice(0, 6).map((text) => (
                                                                    <button
                                                                        key={text}
                                                                        type="button"
                                                                        onClick={() => handlePresetCopy(text)}
                                                                        className="text-xs text-slate-200 rounded-full border border-gray-800 px-3 py-1 hover:border-yellow-400/50"
                                                                    >
                                                                        {text}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                        );
                                    })()}

                                    {/* Score Bar */}
                                    <div className="mt-4 pt-4 border-t border-gray-800">
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-gray-500">{seoCopy.scoreLabel}</span>
                                            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    className={`h-full ${item.score >= SEO_SCORE_THRESHOLDS.excellent
                                                        ? 'bg-green-500'
                                                        : item.score >= SEO_SCORE_THRESHOLDS.good
                                                            ? 'bg-yellow-500'
                                                            : item.score >= SEO_SCORE_THRESHOLDS.ok
                                                                ? 'bg-orange-500'
                                                                : 'bg-red-500'}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.score}%` }}
                                                    transition={{ delay: index * 0.05 + 0.3, duration: 0.5 }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </main>
                <Footer />
            </div>
        </ProtectedRoute>
    );
}
