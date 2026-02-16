'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Header from '../components/Header';
import BackToDashboard from '../components/BackToDashboard';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';

interface Thumbnail {
    id: string;
    title: string;
    notes: string | null;
    image_url: string | null;
    status: string;
    script_title: string | null;
    video_title: string | null;
    created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: 'bg-gray-600' },
    designing: { label: 'Diseñando', color: 'bg-yellow-600' },
    designed: { label: 'Diseñada', color: 'bg-blue-600' },
    approved: { label: 'Aprobada', color: 'bg-green-600' },
};

export default function ThumbnailsPage() {
    const { isAuthenticated } = useAuth();
    const authFetch = useAuthFetch();
    const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', notes: '', imageUrl: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchThumbnails = useCallback(async () => {
        try {
            setLoading(true);
            if (!isAuthenticated) {
                setThumbnails([]);
                return;
            }
            const response = await authFetch('/api/thumbnails');
            if (response.ok) setThumbnails(await response.json());
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, authFetch]);

    useEffect(() => { fetchThumbnails(); }, [fetchThumbnails]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await authFetch('/api/thumbnails', {
                method: 'POST',
                body: JSON.stringify(formData),
            });
            setShowModal(false);
            setFormData({ title: '', notes: '', imageUrl: '' });
            await fetchThumbnails();
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        await authFetch(`/api/thumbnails?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
        await fetchThumbnails();
    };

    const deleteThumbnail = async (id: string) => {
        if (!confirm('¿Eliminar esta miniatura?')) return;
        await authFetch(`/api/thumbnails?id=${id}`, {
            method: 'DELETE',
        });
        await fetchThumbnails();
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-black flex flex-col">
                <Header />
                <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
                    <motion.div
                        className="flex items-center justify-between mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div>
                            <BackToDashboard />
                            <h2 className="text-4xl font-bold text-white mb-2">🖼️ Miniaturas</h2>
                            <p className="text-gray-400">Gestiona las miniaturas de tus videos</p>
                        </div>
                        <motion.button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition-all flex items-center gap-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nueva Miniatura
                        </motion.button>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : thumbnails.length === 0 ? (
                        <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center text-4xl">🖼️</div>
                            <h3 className="text-xl font-semibold text-white mb-2">No hay miniaturas todavía</h3>
                            <p className="text-gray-400">¡Crea tu primera miniatura!</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {thumbnails.map((thumb) => (
                                <motion.div
                                    key={thumb.id}
                                    className="bg-gray-900/50 border border-yellow-500/10 rounded-xl overflow-hidden hover:border-yellow-500/30 transition-all group"
                                    whileHover={{ y: -4 }}
                                >
                                    {/* Preview */}
                                    <div className="relative aspect-video bg-gray-800 flex items-center justify-center">
                                        {thumb.image_url ? (
                                            <Image
                                                src={thumb.image_url}
                                                alt={thumb.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
                                                unoptimized
                                            />
                                        ) : (
                                            <span className="text-6xl opacity-30">🖼️</span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-xs px-2 py-1 rounded ${STATUS_LABELS[thumb.status]?.color || 'bg-gray-600'} text-white`}>
                                                {STATUS_LABELS[thumb.status]?.label || thumb.status}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-yellow-400 transition-colors">
                                            {thumb.title}
                                        </h3>
                                        {thumb.notes && (
                                            <p className="text-gray-400 text-sm line-clamp-2">{thumb.notes}</p>
                                        )}
                                        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-800">
                                            <select
                                                value={thumb.status}
                                                onChange={(e) => updateStatus(thumb.id, e.target.value)}
                                                className="flex-1 text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
                                            >
                                                <option value="pending">Pendiente</option>
                                                <option value="designing">Diseñando</option>
                                                <option value="designed">Diseñada</option>
                                                <option value="approved">Aprobada</option>
                                            </select>
                                            <button
                                                onClick={() => deleteThumbnail(thumb.id)}
                                                className="text-red-400 hover:text-red-300 text-xs px-2"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </main>
                <Footer />

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
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.9 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="text-2xl font-bold text-white mb-6">Nueva Miniatura</h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Título</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            placeholder="Miniatura para..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Notas de diseño</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-24"
                                            placeholder="Colores, texto, expresión facial..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">URL de imagen (opcional)</label>
                                        <input
                                            type="url"
                                            value={formData.imageUrl}
                                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800">
                                            Cancelar
                                        </button>
                                        <button type="submit" disabled={submitting} className="flex-1 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-50">
                                            {submitting ? 'Creando...' : 'Crear'}
                                        </button>
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
