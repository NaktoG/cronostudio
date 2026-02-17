'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import BackToDashboard from '../components/BackToDashboard';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';

interface AnalyticsData {
    period: string;
    total_views: number;
    total_watch_time: number;
    avg_duration: number;
    videos_count?: number;
    channels_count?: number;
}

interface Channel {
    id: string;
    name: string;
}

function AnalyticsContent() {
    const searchParams = useSearchParams();
    const initialChannelId = searchParams.get('channelId') || '';
    const { isAuthenticated } = useAuth();
    const authFetch = useAuthFetch();

    const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtros
    const [channelId, setChannelId] = useState(initialChannelId);
    const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: '',
    });

    // Calcular totales
    const totals = analytics.reduce(
        (acc, item) => ({
            views: acc.views + Number(item.total_views || 0),
            watchTime: acc.watchTime + Number(item.total_watch_time || 0),
            avgDuration: item.avg_duration || 0,
        }),
        { views: 0, watchTime: 0, avgDuration: 0 }
    );

    const fetchChannels = useCallback(async () => {
        try {
            if (!isAuthenticated) {
                setChannels([]);
                return;
            }
            const response = await authFetch('/api/channels');
            if (response.ok) {
                const data = await response.json();
                setChannels(data);
            }
        } catch (err) {
            console.error('Error fetching channels:', err);
        }
    }, [isAuthenticated, authFetch]);

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            if (!isAuthenticated) {
                setAnalytics([]);
                setError(null);
                return;
            }
            const params = new URLSearchParams();

            if (channelId) params.set('channelId', channelId);
            if (groupBy) params.set('groupBy', groupBy);
            if (dateRange.startDate) params.set('startDate', dateRange.startDate);
            if (dateRange.endDate) params.set('endDate', dateRange.endDate);

            const response = await authFetch(`/api/analytics?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Error al cargar analytics');
            }

            const data = await response.json();
            setAnalytics(data.data || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [channelId, groupBy, dateRange, isAuthenticated, authFetch]);

    useEffect(() => {
        fetchChannels();
    }, [fetchChannels]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    // Encontrar el máximo para escalar las barras
    const maxViews = Math.max(...analytics.map(d => Number(d.total_views) || 0), 1);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatMinutes = (mins: number) => {
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    return (
        <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
            {/* Header */}
            <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <BackToDashboard />
                <div className="flex items-center gap-3 mb-2">
                    <span className="w-10 h-10 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                        <BarChart3 className="w-5 h-5" />
                    </span>
                    <h2 className="text-4xl font-semibold text-white">Analitica</h2>
                </div>
                <p className="text-slate-300">
                    Metricas de rendimiento de tus canales y videos
                </p>
            </motion.div>

            {/* Filtros */}
            <motion.div
                className="surface-panel glow-hover p-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Canal */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Canal
                        </label>
                        <select
                            value={channelId}
                            onChange={(e) => setChannelId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        >
                            <option value="">Todos los canales</option>
                            {channels.map((channel) => (
                                <option key={channel.id} value={channel.id}>
                                    {channel.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Agrupar por */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Agrupar por
                        </label>
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        >
                            <option value="day">Día</option>
                            <option value="week">Semana</option>
                            <option value="month">Mes</option>
                        </select>
                    </div>

                    {/* Fecha inicio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Desde
                        </label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    {/* Fecha fin */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Hasta
                        </label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Error */}
            {error && (
                <motion.div
                    className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {error}
                </motion.div>
            )}

            {/* Stats Cards */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <span className="text-sm text-gray-400">Vistas Totales</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{formatNumber(totals.views)}</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-sm text-gray-400">Tiempo de Vista</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{formatMinutes(totals.watchTime)}</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <span className="text-sm text-gray-400">Duración Media</span>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {totals.avgDuration > 0 ? `${Math.floor(totals.avgDuration / 60)}:${(totals.avgDuration % 60).toString().padStart(2, '0')}` : '0:00'}
                    </p>
                </div>
            </motion.div>

            {/* Gráfico de barras */}
            <motion.div
                className="surface-panel glow-hover p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h3 className="text-lg font-semibold text-white mb-6">Vistas por Período</h3>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-400">Cargando datos...</p>
                        </div>
                    </div>
                )}

                {!loading && analytics.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <p className="text-gray-400">No hay datos de analytics disponibles</p>
                        <p className="text-gray-500 text-sm mt-1">
                            Los datos aparecerán cuando empieces a registrar métricas
                        </p>
                    </div>
                )}

                {!loading && analytics.length > 0 && (
                    <div className="space-y-3">
                        {analytics.slice(0, 10).map((item, index) => {
                            const views = Number(item.total_views) || 0;
                            const percentage = (views / maxViews) * 100;
                            const date = new Date(item.period);
                            const formattedDate = date.toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: groupBy === 'month' ? 'numeric' : undefined,
                            });

                            return (
                                <motion.div
                                    key={item.period}
                                    className="flex items-center gap-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <span className="w-20 text-sm text-gray-400 flex-shrink-0">
                                        {formattedDate}
                                    </span>
                                    <div className="flex-1 h-8 bg-gray-800 rounded-lg overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-lg"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                                        />
                                    </div>
                                    <span className="w-16 text-sm text-white text-right font-medium">
                                        {formatNumber(views)}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
        </main>
    );
}

export default function AnalyticsPage() {
    return (
        <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
                <Header />
                <Suspense fallback={
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                }>
                    <AnalyticsContent />
                </Suspense>
                <Footer />
            </div>
        </ProtectedRoute>
    );
}
