'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import BackToDashboard from '../components/BackToDashboard';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { SEO_COPY } from '../content/pages/seo';
import { useRouter } from 'next/navigation';

interface SeoData {
    id: string;
    optimized_title: string;
    description: string | null;
    tags: string[];
    keywords: string[];
    suggestions?: {
        titles?: string[];
        thumbnailTexts?: string[];
    } | null;
    score: number;
    video_title: string | null;
    youtube_video_id: string | null;
    created_at: string;
}

interface Channel {
    id: string;
    name: string;
}

interface IdeaOption {
    id: string;
    title: string;
}

interface ScriptOption {
    id: string;
    title: string;
}

export default function SeoPage() {
    const { isAuthenticated } = useAuth();
    const authFetch = useAuthFetch();
    const { addToast } = useToast();
    const router = useRouter();
    const [seoData, setSeoData] = useState<SeoData[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState('');
    const [ideaOptions, setIdeaOptions] = useState<IdeaOption[]>([]);
    const [scriptOptions, setScriptOptions] = useState<ScriptOption[]>([]);
    const [showPresets, setShowPresets] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const copyToClipboard = async (value: string, label: string) => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            addToast(`${label} copiado`, 'success');
        } catch {
            addToast('No se pudo copiar', 'error');
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds((current) => current.includes(id)
            ? current.filter((item) => item !== id)
            : [...current, id]
        );
    };

    const clearSelection = () => setSelectedIds([]);

    const copySelected = async (type: 'title' | 'description' | 'tags') => {
        if (selectedIds.length === 0) return;
        const items = seoData.filter((item) => selectedIds.includes(item.id));
        if (items.length === 0) return;
        if (type === 'title') {
            await copyToClipboard(items.map((item) => item.optimized_title).join('\n'), 'Títulos');
        }
        if (type === 'description') {
            await copyToClipboard(items.map((item) => item.description || '').filter(Boolean).join('\n\n'), 'Descripciones');
        }
        if (type === 'tags') {
            const tags = items.flatMap((item) => item.tags || []);
            const unique = Array.from(new Set(tags));
            await copyToClipboard(unique.join(', '), 'Tags');
        }
        clearSelection();
    };

    const fetchSeoData = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            if (!isAuthenticated) {
                setSeoData([]);
                setError(null);
                return;
            }
            const query = selectedChannel ? `?channelId=${selectedChannel}` : '';
            const response = await authFetch(`/api/seo${query}`, { signal });
            if (!response.ok) {
                throw new Error(SEO_COPY.errors.load);
            }
            setSeoData(await response.json());
            setError(null);
        } catch (err) {
            if (signal?.aborted) return;
            const message = err instanceof Error ? err.message : SEO_COPY.errors.unknown;
            setError(message);
            addToast(message, 'error');
        } finally {
            if (signal?.aborted) return;
            setLoading(false);
        }
    }, [isAuthenticated, authFetch, addToast, selectedChannel]);

    useEffect(() => {
        const controller = new AbortController();
        fetchSeoData(controller.signal);
        return () => controller.abort();
    }, [fetchSeoData]);

    const fetchChannels = useCallback(async (signal?: AbortSignal) => {
        try {
            if (!isAuthenticated) {
                setChannels([]);
                return;
            }
            const response = await authFetch('/api/channels', { signal });
            if (response.ok) {
                setChannels(await response.json());
            }
        } catch (err) {
            if (signal?.aborted) return;
            console.error('Error fetching channels:', err);
        }
    }, [isAuthenticated, authFetch]);

    useEffect(() => {
        if (!isAuthenticated) return;
        const controller = new AbortController();
        fetchChannels(controller.signal);
        return () => controller.abort();
    }, [isAuthenticated, fetchChannels]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const storedChannel = window.localStorage.getItem('cronostudio.channelId') || '';
        if (storedChannel && storedChannel !== selectedChannel) {
            setSelectedChannel(storedChannel);
        }
    }, [selectedChannel]);

    const fetchIdeaOptions = useCallback(async (signal?: AbortSignal) => {
        if (!selectedChannel) {
            setIdeaOptions([]);
            return;
        }
        try {
            const response = await authFetch(`/api/ideas?channelId=${selectedChannel}`, { signal });
            if (response.ok) {
                const data = await response.json();
                const options = Array.isArray(data)
                    ? data.map((idea) => ({ id: idea.id, title: idea.title }))
                    : [];
                setIdeaOptions(options);
            }
        } catch (err) {
            if (signal?.aborted) return;
            console.error('Error fetching ideas:', err);
        }
    }, [authFetch, selectedChannel]);

    const fetchScriptOptions = useCallback(async (signal?: AbortSignal) => {
        if (!selectedChannel) {
            setScriptOptions([]);
            return;
        }
        try {
            const response = await authFetch(`/api/scripts?channelId=${selectedChannel}`, { signal });
            if (response.ok) {
                const data = await response.json();
                const options = Array.isArray(data)
                    ? data.map((script) => ({ id: script.id, title: script.title }))
                    : [];
                setScriptOptions(options);
            }
        } catch (err) {
            if (signal?.aborted) return;
            console.error('Error fetching scripts:', err);
        }
    }, [authFetch, selectedChannel]);

    useEffect(() => {
        if (!isAuthenticated) return;
        const controller = new AbortController();
        fetchIdeaOptions(controller.signal);
        fetchScriptOptions(controller.signal);
        return () => controller.abort();
    }, [isAuthenticated, fetchIdeaOptions, fetchScriptOptions]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        if (score >= 40) return 'text-orange-400';
        return 'text-red-400';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return SEO_COPY.score.excellent;
        if (score >= 60) return SEO_COPY.score.good;
        if (score >= 40) return SEO_COPY.score.ok;
        return SEO_COPY.score.bad;
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
                    <h1 className="sr-only">{SEO_COPY.title}</h1>
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
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">{SEO_COPY.title}</h2>
                            </div>
                            <p className="text-sm sm:text-base text-slate-300">{SEO_COPY.subtitle}</p>
                        </div>
                        {channels.length > 0 && (
                            <div className="min-w-[220px]">
                                <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Canal</label>
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
                                    <option value="">Todos los canales</option>
                                    {channels.map((channel) => (
                                        <option key={channel.id} value={channel.id}>
                                            {channel.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {selectedIds.length > 0 && (
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <span className="text-xs text-slate-400">{selectedIds.length} seleccionados</span>
                                <button
                                    type="button"
                                    onClick={() => copySelected('title')}
                                    className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                                >
                                    Copiar títulos
                                </button>
                                <button
                                    type="button"
                                    onClick={() => copySelected('description')}
                                    className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                                >
                                    Copiar descripciones
                                </button>
                                <button
                                    type="button"
                                    onClick={() => copySelected('tags')}
                                    className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                                >
                                    Copiar tags
                                </button>
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                                >
                                    Limpiar
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
                            {SEO_COPY.tipsTitle}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                            {SEO_COPY.tips.map((tip) => (
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
                                    onClick={() => fetchSeoData()}
                                    className="text-xs font-semibold text-yellow-300 hover:text-yellow-200"
                                >
                                    Reintentar
                                </button>
                            </div>
                        </motion.div>
                    ) : seoData.length === 0 ? (
                        <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-900/60 border border-gray-800 rounded-full flex items-center justify-center text-yellow-400">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{SEO_COPY.emptyTitle}</h3>
                            <p className="text-slate-300 mb-2">{SEO_COPY.emptySubtitle}</p>
                            <p className="text-slate-500 text-sm">{SEO_COPY.emptyHint}</p>
                            <motion.div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                                <motion.button
                                    onClick={() => router.push('/channels')}
                                    className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {SEO_COPY.connectChannel}
                                </motion.button>
                                <motion.button
                                    onClick={() => router.push('/analytics')}
                                    className="px-6 py-3 border border-gray-700 text-gray-200 rounded-lg hover:bg-gray-800"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {SEO_COPY.viewAnalytics}
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
                                                    aria-label={`Seleccionar SEO ${item.optimized_title}`}
                                                    className="h-4 w-4 rounded border-gray-700 text-yellow-400 focus:ring-yellow-400"
                                                />
                                                Seleccionar
                                            </label>
                                            <h3 className="text-lg font-semibold text-white break-words">
                                                {item.optimized_title}
                                            </h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(item.optimized_title, 'Título')}
                                                className="text-[11px] px-2 py-1 rounded-full border border-gray-800 text-slate-300 hover:text-white"
                                            >
                                                Copiar título
                                            </button>
                                            {item.description && (
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(item.description ?? '', 'Descripción')}
                                                    className="text-[11px] px-2 py-1 rounded-full border border-gray-800 text-slate-300 hover:text-white"
                                                >
                                                    Copiar descripción
                                                </button>
                                            )}
                                            {item.tags?.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(item.tags.join(', '), 'Tags')}
                                                    className="text-[11px] px-2 py-1 rounded-full border border-gray-800 text-slate-300 hover:text-white"
                                                >
                                                    Copiar tags
                                                </button>
                                            )}
                                        </div>
                                            {item.video_title && (
                                                <p className="text-sm text-gray-500">{SEO_COPY.videoPrefix} {item.video_title}</p>
                                            )}
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <input
                                                    type="text"
                                                    list="seo-idea-options"
                                                    placeholder="Idea ID"
                                                    className="w-40 rounded-lg border border-gray-800 bg-gray-900/70 px-3 py-2 text-xs text-slate-200"
                                                />
                                                <input
                                                    type="text"
                                                    list="seo-script-options"
                                                    placeholder="Script ID"
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
                                                    +{item.tags.length - 8} más
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {(item.suggestions?.titles?.length || item.suggestions?.thumbnailTexts?.length) && (
                                        <div className="mt-2 rounded-lg border border-gray-800 bg-gray-900/60 p-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowPresets((current) => !current)}
                                                className="text-xs uppercase tracking-[0.2em] text-yellow-300"
                                            >
                                                {showPresets ? 'Ocultar presets' : 'Ver presets'}
                                            </button>
                                            {showPresets && (
                                                <div className="mt-3 space-y-3">
                                                    {item.suggestions?.titles?.length ? (
                                                        <div>
                                                            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Títulos sugeridos</div>
                                                            <div className="mt-2 flex flex-col gap-2">
                                                                {item.suggestions.titles.slice(0, 6).map((title) => (
                                                                    <button
                                                                        key={title}
                                                                        type="button"
                                                                        onClick={() => copyToClipboard(title, 'Título sugerido')}
                                                                        className="text-left text-xs text-slate-200 rounded-lg border border-gray-800 px-3 py-2 hover:border-yellow-400/50"
                                                                    >
                                                                        {title}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                    {item.suggestions?.thumbnailTexts?.length ? (
                                                        <div>
                                                            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Textos de miniatura</div>
                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                {item.suggestions.thumbnailTexts.slice(0, 6).map((text) => (
                                                                    <button
                                                                        key={text}
                                                                        type="button"
                                                                        onClick={() => copyToClipboard(text, 'Texto de miniatura')}
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
                                    )}

                                    {/* Score Bar */}
                                    <div className="mt-4 pt-4 border-t border-gray-800">
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-gray-500">{SEO_COPY.scoreLabel}</span>
                                            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    className={`h-full ${item.score >= 80 ? 'bg-green-500' : item.score >= 60 ? 'bg-yellow-500' : item.score >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
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
