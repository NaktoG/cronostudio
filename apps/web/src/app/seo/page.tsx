'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import BackToDashboard from '../components/BackToDashboard';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';

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
    const [seoData, setSeoData] = useState<SeoData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSeoData = useCallback(async () => {
        try {
            setLoading(true);
            if (!isAuthenticated) {
                setSeoData([]);
                return;
            }
            const response = await authFetch('/api/seo');
            if (response.ok) setSeoData(await response.json());
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, authFetch]);

    useEffect(() => { fetchSeoData(); }, [fetchSeoData]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        if (score >= 40) return 'text-orange-400';
        return 'text-red-400';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excelente';
        if (score >= 60) return 'Bueno';
        if (score >= 40) return 'Mejorable';
        return 'Necesita trabajo';
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
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
                            <h2 className="text-4xl font-semibold text-white">SEO</h2>
                        </div>
                        <p className="text-slate-300">Optimizacion de titulos, descripciones y tags para YouTube</p>
                    </motion.div>

                    {/* Tips Card */}
                    <motion.div
                        className="surface-panel glow-hover p-6 mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Consejos SEO para YouTube
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-white font-medium mb-1">Título</p>
                                <p className="text-gray-400">30-60 caracteres, palabra clave al inicio</p>
                            </div>
                            <div>
                                <p className="text-white font-medium mb-1">Descripción</p>
                                <p className="text-gray-400">100-500 caracteres, links y CTAs incluidos</p>
                            </div>
                            <div>
                                <p className="text-white font-medium mb-1">Tags</p>
                                <p className="text-gray-400">5-15 tags relevantes y específicos</p>
                            </div>
                        </div>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : seoData.length === 0 ? (
                        <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-900/60 border border-gray-800 rounded-full flex items-center justify-center text-yellow-400">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No hay datos SEO todavia</h3>
                            <p className="text-slate-300 mb-2">Los datos SEO se crean automaticamente cuando subes un video</p>
                            <p className="text-slate-500 text-sm">Tambien puedes usar n8n para generar SEO automaticamente</p>
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
                                                <p className="text-sm text-gray-500">Video: {item.video_title}</p>
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
                                            <span className="text-xs text-gray-500">Score SEO</span>
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
