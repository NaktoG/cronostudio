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
import { ANALYTICS_COPY } from '../content/pages/analytics';
import { formatDate, formatMonthYear } from '@/lib/dates';

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

function AnalyticsView() {
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
    const [visibleCount, setVisibleCount] = useState(10);

    // Calcular totales
    const totals = analytics.reduce(
        (acc, item) => ({
            views: acc.views + Number(item.total_views || 0),
            watchTime: acc.watchTime + Number(item.total_watch_time || 0),
        }),
        { views: 0, watchTime: 0 }
    );

    const avgDurationSeconds = totals.views > 0
        ? Math.round((totals.watchTime * 60) / totals.views)
        : 0;

    const fetchChannels = useCallback(async (signal?: AbortSignal) => {
        try {
            if (!isAuthenticated) {
                setChannels([]);
                return;
            }
            const response = await authFetch('/api/channels', { signal });
            if (response.ok) {
                const data = await response.json();
                setChannels(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            if (signal?.aborted) return;
            console.error('Error fetching channels:', err);
        }
    }, [isAuthenticated, authFetch]);

    const fetchAnalytics = useCallback(async (signal?: AbortSignal) => {
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

            const response = await authFetch(`/api/analytics?${params.toString()}`, { signal });

            if (!response.ok) {
                throw new Error(ANALYTICS_COPY.errors.load);
            }

            const data = await response.json();
            setAnalytics(data.data || []);
            setError(null);
        } catch (err) {
            if (signal?.aborted) return;
            setError(err instanceof Error ? err.message : ANALYTICS_COPY.errors.unknown);
        } finally {
            if (signal?.aborted) return;
            setLoading(false);
        }
    }, [channelId, groupBy, dateRange, isAuthenticated, authFetch]);

    useEffect(() => {
        const controller = new AbortController();
        fetchChannels(controller.signal);
        return () => controller.abort();
    }, [fetchChannels]);

    useEffect(() => {
        const controller = new AbortController();
        fetchAnalytics(controller.signal);
        return () => controller.abort();
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

    const applyQuickRange = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        setDateRange({
            startDate: start.toISOString().slice(0, 10),
            endDate: end.toISOString().slice(0, 10),
        });
    };

    return (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
            <h1 className="sr-only">{ANALYTICS_COPY.title}</h1>
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
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">{ANALYTICS_COPY.title}</h2>
                </div>
                <p className="text-sm sm:text-base text-slate-300">{ANALYTICS_COPY.subtitle}</p>
            </motion.div>

            {/* Filtros */}
            <motion.div
                className="surface-panel glow-hover p-4 sm:p-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Canal */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            {ANALYTICS_COPY.filters.channel}
                        </label>
                        <select
                            value={channelId}
                            onChange={(e) => setChannelId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        >
                            <option value="">{ANALYTICS_COPY.filters.allChannels}</option>
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
                            {ANALYTICS_COPY.filters.groupBy}
                        </label>
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        >
                            <option value="day">{ANALYTICS_COPY.filters.day}</option>
                            <option value="week">{ANALYTICS_COPY.filters.week}</option>
                            <option value="month">{ANALYTICS_COPY.filters.month}</option>
                        </select>
                    </div>

                    {/* Fecha inicio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            {ANALYTICS_COPY.filters.from}
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
                            {ANALYTICS_COPY.filters.to}
                        </label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>
                </div>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
                    {ANALYTICS_COPY.filters.quick.map((days) => (
                        <button
                            key={days}
                            onClick={() => applyQuickRange(days)}
                            className="text-xs px-3 py-1.5 rounded-full border border-gray-700 text-slate-300 hover:text-white hover:border-yellow-400 whitespace-nowrap"
                        >
                            {days} {ANALYTICS_COPY.filters.quickSuffix}
                        </button>
                    ))}
                    <button
                        onClick={() => setDateRange({ startDate: '', endDate: '' })}
                        className="text-xs px-3 py-1.5 rounded-full border border-gray-700 text-slate-300 hover:text-white whitespace-nowrap"
                    >
                        {ANALYTICS_COPY.filters.reset}
                    </button>
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
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8"
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
                        <span className="text-sm text-gray-400">{ANALYTICS_COPY.cards.views}</span>
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
                        <span className="text-sm text-gray-400">{ANALYTICS_COPY.cards.watchTime}</span>
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
                        <span className="text-sm text-gray-400">{ANALYTICS_COPY.cards.avgDuration}</span>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {avgDurationSeconds > 0
                            ? `${Math.floor(avgDurationSeconds / 60)}:${(avgDurationSeconds % 60).toString().padStart(2, '0')}`
                            : '0:00'}
                    </p>
                </div>
            </motion.div>

            {/* Gráfico de barras */}
            <motion.div
                className="surface-panel glow-hover p-4 sm:p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h3 className="text-lg font-semibold text-white mb-6">{ANALYTICS_COPY.chart.title}</h3>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-400">{ANALYTICS_COPY.chart.loading}</p>
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
                        <p className="text-gray-400">{ANALYTICS_COPY.empty.title}</p>
                        <p className="text-gray-500 text-sm mt-1">{ANALYTICS_COPY.empty.subtitle}</p>
                    </div>
                )}

                {!loading && analytics.length > 0 && (
                    <div className="space-y-3">
                        {analytics.slice(0, visibleCount).map((item, index) => {
                            const views = Number(item.total_views) || 0;
                            const percentage = (views / maxViews) * 100;
                            const date = new Date(item.period);
                            const formattedDate = groupBy === 'month'
                                ? formatMonthYear(date)
                                : formatDate(date);

                            return (
                                <motion.div
                                    key={item.period}
                                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <span className="text-sm text-gray-400 flex-shrink-0 sm:w-20">
                                        {formattedDate}
                                    </span>
                                    <div className="flex-1 h-6 sm:h-8 bg-gray-800 rounded-lg overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-lg"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                                        />
                                    </div>
                                    <span className="text-sm text-white font-medium sm:w-16 sm:text-right">
                                        {formatNumber(views)}
                                    </span>
                                </motion.div>
                            );
                        })}
                        {analytics.length > 10 && (
                            <div className="pt-4 flex justify-center">
                                <button
                                    onClick={() => setVisibleCount(visibleCount === 10 ? 30 : 10)}
                                    className="text-xs px-4 py-2 rounded-full border border-gray-700 text-slate-300 hover:text-white"
                                >
                                    {visibleCount === 10 ? ANALYTICS_COPY.chart.showMore : ANALYTICS_COPY.chart.showLess}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </main>
    );
}

function AnalyticsShell() {
    return (
        <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
                <Header />
                <Suspense fallback={
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                }>
                    <AnalyticsView />
                </Suspense>
                <Footer />
            </div>
        </ProtectedRoute>
    );
}

export default function AnalyticsPage() {
    return <AnalyticsShell />;
}
