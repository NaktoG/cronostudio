'use client';

import { useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import { Plus, Tv } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Header from '../components/Header';
import BackToDashboard from '../components/BackToDashboard';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { CHANNELS_COPY } from '../content/pages/channels';
import useDialogFocus from '../hooks/useDialogFocus';

interface Channel {
    id: string;
    name: string;
    youtube_channel_id: string;
    subscribers: number;
    created_at: string;
    updated_at: string;
}

export default function ChannelsPage() {
    const { isAuthenticated } = useAuth();
    const authFetch = useAuthFetch();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        youtubeChannelId: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const { addToast } = useToast();
    const modalRef = useRef<HTMLDivElement>(null);

    useDialogFocus(modalRef, showModal);

    const fetchChannels = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            if (!isAuthenticated) {
                setChannels([]);
                return;
            }
            const response = await authFetch('/api/channels', { signal });

            if (!response.ok) {
                throw new Error('Error al cargar canales');
            }

            const data = await response.json();
            setChannels(data);
            setError(null);
        } catch (err) {
            if (signal?.aborted) return;
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            if (signal?.aborted) return;
            setLoading(false);
        }
    }, [isAuthenticated, authFetch]);

    useEffect(() => {
        const controller = new AbortController();
        fetchChannels(controller.signal);
        return () => controller.abort();
    }, [fetchChannels]);

    useEffect(() => {
        if (!showModal) return;
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowModal(false);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [showModal]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const targetUrl = editingChannel ? `/api/channels?id=${editingChannel.id}` : '/api/channels';
            const method = editingChannel ? 'PUT' : 'POST';
            const response = await authFetch(targetUrl, {
                method,
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al crear canal');
            }

            addToast(editingChannel ? 'Canal actualizado' : 'Canal creado', 'success');
            setShowModal(false);
            setEditingChannel(null);
            setFormData({ name: '', youtubeChannelId: '' });
            await fetchChannels();
        } catch (err) {
            addToast(err instanceof Error ? err.message : 'Error desconocido', 'error');
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (channel: Channel) => {
        setEditingChannel(channel);
        setFormData({ name: channel.name, youtubeChannelId: channel.youtube_channel_id });
        setShowModal(true);
    };

    const handleDelete = async (channel: Channel) => {
        if (!confirm(`Eliminar canal "${channel.name}"?`)) return;
        try {
            const response = await authFetch(`/api/channels?id=${channel.id}`, { method: 'DELETE' });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al eliminar canal');
            }
            addToast('Canal eliminado', 'success');
            await fetchChannels();
        } catch (err) {
            addToast(err instanceof Error ? err.message : 'Error desconocido', 'error');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
                <Header />

                <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
                    {/* Header de sección */}
                    <motion.div
                        className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div>
                            <BackToDashboard />
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-10 h-10 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                                    <Tv className="w-5 h-5" />
                                </span>
                                <h2 className="text-4xl font-semibold text-white">{CHANNELS_COPY.title}</h2>
                            </div>
                            <p className="text-slate-300">{CHANNELS_COPY.subtitle}</p>
                        </div>

                        <motion.button
                            onClick={() => setShowModal(true)}
                            className="w-full px-6 py-3 text-sm font-semibold text-black rounded-lg flex items-center justify-center gap-2 sm:w-auto"
                            style={{
                                background: 'linear-gradient(135deg, rgba(246, 201, 69, 0.95), rgba(246, 201, 69, 0.7))',
                                boxShadow: '0 10px 20px rgba(246, 201, 69, 0.22)',
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Plus className="w-4 h-4" />
                            {CHANNELS_COPY.create}
                        </motion.button>
                    </motion.div>

                    {/* Mensajes */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                <p className="text-gray-400">{CHANNELS_COPY.loading}</p>
                            </div>
                        </div>
                    )}

                    {/* Lista de canales */}
                    {!loading && channels.length === 0 && (
                        <motion.div
                            className="text-center py-20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{CHANNELS_COPY.emptyTitle}</h3>
                                <p className="text-gray-400 mb-6">{CHANNELS_COPY.emptySubtitle}</p>
                                <motion.button
                                    onClick={() => {
                                        setEditingChannel(null);
                                        setFormData({ name: '', youtubeChannelId: '' });
                                        setShowModal(true);
                                    }}
                                    className="w-full px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition-all sm:w-auto"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {CHANNELS_COPY.emptyAction}
                                </motion.button>
                            </motion.div>
                        )}

                    {!loading && channels.length > 0 && (
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {channels.map((channel) => (
                                <motion.div
                                    key={channel.id}
                                    variants={itemVariants}
                                    className="surface-panel glow-hover p-6 transition-all group"
                                    whileHover={{ y: -4 }}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                                            ID: {channel.youtube_channel_id.slice(0, 8)}...
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold text-white group-hover:text-yellow-400 transition-colors">
                                        {channel.name}
                                        </h3>
                                        <span className={`text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-full border ${
                                            channel.subscribers > 0
                                                ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                                                : 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                                        }`}>
                                            {channel.subscribers > 0 ? CHANNELS_COPY.statusConnected : CHANNELS_COPY.statusPending}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            {channel.subscribers?.toLocaleString() || 0} subs
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <span className="text-xs text-gray-500">
                                            {CHANNELS_COPY.createdAt} {new Date(channel.created_at).toLocaleDateString('es-ES')}
                                        </span>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <button
                                                onClick={() => handleEdit(channel)}
                                                className="text-xs text-slate-300 hover:text-white"
                                            >
                                                {CHANNELS_COPY.edit}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(channel)}
                                                className="text-xs text-red-300 hover:text-red-200"
                                            >
                                                {CHANNELS_COPY.delete}
                                            </button>
                                            <Link
                                                href={`/analytics?channelId=${channel.id}`}
                                                className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                                            >
                                                {CHANNELS_COPY.viewAnalytics}
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </main>

                <Footer />

                {/* Modal para añadir canal */}
                <AnimatePresence>
                    {showModal && (
                        <motion.div
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                        >
                            <motion.div
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="channel-modal-title"
                                className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-6 sm:p-8 w-full max-w-md max-h-[85vh] overflow-y-auto"
                                ref={modalRef}
                                tabIndex={-1}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 id="channel-modal-title" className="text-2xl font-bold text-white mb-6">
                                    {editingChannel ? CHANNELS_COPY.modalTitleEdit : CHANNELS_COPY.modalTitleCreate}
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                            {CHANNELS_COPY.form.name}
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                                            placeholder={CHANNELS_COPY.form.placeholderName}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="youtubeChannelId" className="block text-sm font-medium text-gray-300 mb-2">
                                            {CHANNELS_COPY.form.youtubeId}
                                        </label>
                                        <input
                                            id="youtubeChannelId"
                                            type="text"
                                            value={formData.youtubeChannelId}
                                            onChange={(e) => setFormData({ ...formData, youtubeChannelId: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                                            placeholder={CHANNELS_COPY.form.placeholderId}
                                            required={!editingChannel}
                                            disabled={Boolean(editingChannel)}
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            {CHANNELS_COPY.form.youtubeHelp}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 py-3 px-4 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-800 transition-colors"
                                        >
                                            {CHANNELS_COPY.cancel}
                                        </button>
                                        <motion.button
                                            type="submit"
                                            disabled={submitting}
                                            className="flex-1 py-3 px-4 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            whileHover={{ scale: submitting ? 1 : 1.02 }}
                                            whileTap={{ scale: submitting ? 1 : 0.98 }}
                                        >
                                            {submitting ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    {editingChannel ? CHANNELS_COPY.submittingEdit : CHANNELS_COPY.submittingCreate}
                                                </span>
                                            ) : (
                                                editingChannel ? CHANNELS_COPY.submitEdit : CHANNELS_COPY.submitCreate
                                            )}
                                        </motion.button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ProtectedRoute>
    );
}
