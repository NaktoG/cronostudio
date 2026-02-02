'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';

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
    const [formData, setFormData] = useState({
        name: '',
        youtubeChannelId: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchChannels = useCallback(async () => {
        try {
            setLoading(true);
            if (!isAuthenticated) {
                setChannels([]);
                return;
            }
            const response = await authFetch('/api/channels');

            if (!response.ok) {
                throw new Error('Error al cargar canales');
            }

            const data = await response.json();
            setChannels(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, authFetch]);

    useEffect(() => {
        fetchChannels();
    }, [fetchChannels]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const response = await authFetch('/api/channels', {
                method: 'POST',
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al crear canal');
            }

            setSuccessMessage('Canal creado exitosamente');
            setShowModal(false);
            setFormData({ name: '', youtubeChannelId: '' });
            await fetchChannels();

            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setSubmitting(false);
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
            <div className="min-h-screen bg-black flex flex-col">
                <Header />

                <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
                    {/* Header de sección */}
                    <motion.div
                        className="flex items-center justify-between mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div>
                            <h2 className="text-4xl font-bold text-white mb-2">Canales</h2>
                            <p className="text-gray-400">
                                Gestiona tus canales de YouTube conectados
                            </p>
                        </div>

                        <motion.button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/25 transition-all flex items-center gap-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Añadir Canal
                        </motion.button>
                    </motion.div>

                    {/* Mensajes */}
                    <AnimatePresence>
                        {successMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400"
                            >
                                {successMessage}
                            </motion.div>
                        )}

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
                                <p className="text-gray-400">Cargando canales...</p>
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
                            <h3 className="text-xl font-semibold text-white mb-2">No hay canales</h3>
                            <p className="text-gray-400 mb-6">
                                Conecta tu primer canal de YouTube para comenzar
                            </p>
                            <motion.button
                                onClick={() => setShowModal(true)}
                                className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition-all"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Añadir Canal
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
                                    className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/10 rounded-xl p-6 hover:border-yellow-500/30 transition-all group"
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

                                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                                        {channel.name}
                                    </h3>

                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            {channel.subscribers?.toLocaleString() || 0} subs
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                                        <span className="text-xs text-gray-500">
                                            Añadido: {new Date(channel.created_at).toLocaleDateString('es-ES')}
                                        </span>
                                        <Link
                                            href={`/analytics?channelId=${channel.id}`}
                                            className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                                        >
                                            Ver Analytics →
                                        </Link>
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
                                className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-8 w-full max-w-md"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="text-2xl font-bold text-white mb-6">Añadir Canal</h3>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                            Nombre del Canal
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                                            placeholder="Mi Canal de YouTube"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="youtubeChannelId" className="block text-sm font-medium text-gray-300 mb-2">
                                            YouTube Channel ID
                                        </label>
                                        <input
                                            id="youtubeChannelId"
                                            type="text"
                                            value={formData.youtubeChannelId}
                                            onChange={(e) => setFormData({ ...formData, youtubeChannelId: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                                            placeholder="UCxxxxxxxxxxxxx"
                                            required
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Puedes encontrarlo en la URL de tu canal de YouTube
                                        </p>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 py-3 px-4 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-800 transition-colors"
                                        >
                                            Cancelar
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
                                                    Creando...
                                                </span>
                                            ) : (
                                                'Crear Canal'
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
