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
    score: number;
    video_title: string | null;
    youtube_video_id: string | null;
    created_at: string;
}

export default function SeoPage() {
    const { isAuthenticated } = useAuth();
    const authFetch = useAuthFetch();
    const { addToast } = useToast();
    const router = useRouter();
    const [seoData, setSeoData] = useState<SeoData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSeoData = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            if (!isAuthenticated) {
                setSeoData([]);
                setError(null);
                return;
            }
            const response = await authFetch('/api/seo', { signal });
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
    }, [isAuthenticated, authFetch, addToast]);

    useEffect(() => {
        const controller = new AbortController();
        fetchSeoData(controller.signal);
        return () => controller.abort();
    }, [fetchSeoData]);

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
                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <BackToDashboard />
                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-10 h-10 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                                <Search className="w-5 h-5" />
                            </span>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">{SEO_COPY.title}</h2>
                        </div>
                        <p className="text-sm sm:text-base text-slate-300">{SEO_COPY.subtitle}</p>
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
                            {error}
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
                            {seoData.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    className="surface-panel glow-hover p-6 transition-all"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-white">
                                                    {item.optimized_title}
                                                </h3>
                                            </div>
                                            {item.video_title && (
                                                <p className="text-sm text-gray-500">{SEO_COPY.videoPrefix} {item.video_title}</p>
                                            )}
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
