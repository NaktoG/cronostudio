'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';

interface Idea {
    id: string;
    title: string;
    description: string | null;
    status: 'draft' | 'approved' | 'in_production' | 'completed' | 'archived';
    priority: number;
    tags: string[];
    channel_name: string | null;
    created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    draft: { label: 'Borrador', color: 'bg-gray-600' },
    approved: { label: 'Aprobada', color: 'bg-green-600' },
    in_production: { label: 'En Producción', color: 'bg-yellow-600' },
    completed: { label: 'Completada', color: 'bg-blue-600' },
    archived: { label: 'Archivada', color: 'bg-gray-800' },
};

export default function IdeasPage() {
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', priority: 0 });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchIdeas = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('cronostudio_token');
            const response = await fetch('/api/ideas', {
                headers: { ...(token && { Authorization: `Bearer ${token}` }) },
            });
            if (response.ok) {
                setIdeas(await response.json());
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchIdeas(); }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const token = localStorage.getItem('cronostudio_token');
            const response = await fetch('/api/ideas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al crear idea');
            }
            setShowModal(false);
            setFormData({ title: '', description: '', priority: 0 });
            await fetchIdeas();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setSubmitting(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        const token = localStorage.getItem('cronostudio_token');
        await fetch(`/api/ideas?id=${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ status }),
        });
        await fetchIdeas();
    };

    const deleteIdea = async (id: string) => {
        if (!confirm('¿Eliminar esta idea?')) return;
        const token = localStorage.getItem('cronostudio_token');
        await fetch(`/api/ideas?id=${id}`, {
            method: 'DELETE',
            headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        });
        await fetchIdeas();
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
                            <h2 className="text-4xl font-bold text-white mb-2">💡 Ideas</h2>
                            <p className="text-gray-400">Apunta y gestiona tus ideas para videos</p>
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
                            Nueva Idea
                        </motion.button>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : ideas.length === 0 ? (
                        <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center text-4xl">💡</div>
                            <h3 className="text-xl font-semibold text-white mb-2">No hay ideas todavía</h3>
                            <p className="text-gray-400">¡Apunta tu primera idea para un video!</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {ideas.map((idea) => (
                                <motion.div
                                    key={idea.id}
                                    className="bg-gray-900/50 border border-yellow-500/10 rounded-xl p-6 hover:border-yellow-500/30 transition-all group"
                                    whileHover={{ y: -4 }}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`text-xs px-2 py-1 rounded ${STATUS_LABELS[idea.status]?.color || 'bg-gray-600'} text-white`}>
                                            {STATUS_LABELS[idea.status]?.label || idea.status}
                                        </span>
                                        <span className="text-xs text-yellow-400">★ {idea.priority}</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                                        {idea.title}
                                    </h3>
                                    {idea.description && (
                                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{idea.description}</p>
                                    )}
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
                                        <select
                                            value={idea.status}
                                            onChange={(e) => updateStatus(idea.id, e.target.value)}
                                            className="flex-1 text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
                                        >
                                            <option value="draft">Borrador</option>
                                            <option value="approved">Aprobada</option>
                                            <option value="in_production">En Producción</option>
                                            <option value="completed">Completada</option>
                                            <option value="archived">Archivada</option>
                                        </select>
                                        <button
                                            onClick={() => deleteIdea(idea.id)}
                                            className="text-red-400 hover:text-red-300 text-xs px-2"
                                        >
                                            Eliminar
                                        </button>
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
                                <h3 className="text-2xl font-bold text-white mb-6">Nueva Idea</h3>
                                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Título</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            placeholder="Idea para video..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-24"
                                            placeholder="Detalles de la idea..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Prioridad (0-10)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800">
                                            Cancelar
                                        </button>
                                        <button type="submit" disabled={submitting} className="flex-1 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-50">
                                            {submitting ? 'Creando...' : 'Crear Idea'}
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
