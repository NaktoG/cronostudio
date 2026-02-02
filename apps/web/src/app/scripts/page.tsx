'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';

interface Script {
    id: string;
    title: string;
    intro: string | null;
    body: string | null;
    cta: string | null;
    outro: string | null;
    status: string;
    word_count: number;
    estimated_duration_seconds: number;
    idea_title: string | null;
    created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    draft: { label: 'Borrador', color: 'bg-gray-600' },
    review: { label: 'En Revisión', color: 'bg-yellow-600' },
    approved: { label: 'Aprobado', color: 'bg-green-600' },
    recorded: { label: 'Grabado', color: 'bg-blue-600' },
};

export default function ScriptsPage() {
    const { isAuthenticated } = useAuth();
    const authFetch = useAuthFetch();
    const [scripts, setScripts] = useState<Script[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ title: '', intro: '', body: '', cta: '', outro: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchScripts = useCallback(async () => {
        try {
            setLoading(true);
            if (!isAuthenticated) {
                setScripts([]);
                return;
            }
            const response = await authFetch('/api/scripts');
            if (response.ok) setScripts(await response.json());
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, authFetch]);

    useEffect(() => { fetchScripts(); }, [fetchScripts]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = editingId ? `/api/scripts?id=${editingId}` : '/api/scripts';
            const method = editingId ? 'PUT' : 'POST';

            await authFetch(url, {
                method,
                body: JSON.stringify(formData),
            });
            setShowModal(false);
            setEditingId(null);
            setFormData({ title: '', intro: '', body: '', cta: '', outro: '' });
            await fetchScripts();
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const openEdit = (script: Script) => {
        setFormData({
            title: script.title,
            intro: script.intro || '',
            body: script.body || '',
            cta: script.cta || '',
            outro: script.outro || '',
        });
        setEditingId(script.id);
        setShowModal(true);
    };

    const deleteScript = async (id: string) => {
        if (!confirm('¿Eliminar este guion?')) return;
        await authFetch(`/api/scripts?id=${id}`, {
            method: 'DELETE',
        });
        await fetchScripts();
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                            <h2 className="text-4xl font-bold text-white mb-2">📝 Guiones</h2>
                            <p className="text-gray-400">Escribe y gestiona los guiones de tus videos</p>
                        </div>
                        <motion.button
                            onClick={() => { setEditingId(null); setFormData({ title: '', intro: '', body: '', cta: '', outro: '' }); setShowModal(true); }}
                            className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition-all flex items-center gap-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nuevo Guion
                        </motion.button>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : scripts.length === 0 ? (
                        <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center text-4xl">📝</div>
                            <h3 className="text-xl font-semibold text-white mb-2">No hay guiones todavía</h3>
                            <p className="text-gray-400">¡Escribe tu primer guion!</p>
                        </motion.div>
                    ) : (
                        <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {scripts.map((script) => (
                                <motion.div
                                    key={script.id}
                                    className="bg-gray-900/50 border border-yellow-500/10 rounded-xl p-6 hover:border-yellow-500/30 transition-all"
                                    whileHover={{ x: 4 }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`text-xs px-2 py-1 rounded ${STATUS_LABELS[script.status]?.color || 'bg-gray-600'} text-white`}>
                                                    {STATUS_LABELS[script.status]?.label || script.status}
                                                </span>
                                                <span className="text-xs text-gray-500">{script.word_count} palabras</span>
                                                <span className="text-xs text-yellow-400">⏱ ~{formatDuration(script.estimated_duration_seconds)}</span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-white">{script.title}</h3>
                                            {script.idea_title && (
                                                <p className="text-sm text-gray-500 mt-1">De idea: {script.idea_title}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEdit(script)} className="px-3 py-1 text-sm text-yellow-400 hover:text-yellow-300">
                                                Editar
                                            </button>
                                            <button onClick={() => deleteScript(script.id)} className="px-3 py-1 text-sm text-red-400 hover:text-red-300">
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
                                className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.9 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="text-2xl font-bold text-white mb-6">
                                    {editingId ? 'Editar Guion' : 'Nuevo Guion'}
                                </h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Título</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">🎬 Intro</label>
                                        <textarea
                                            value={formData.intro}
                                            onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-24"
                                            placeholder="Hook inicial, gancho para el espectador..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">📖 Desarrollo</label>
                                        <textarea
                                            value={formData.body}
                                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-40"
                                            placeholder="Contenido principal del video..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">📢 CTA (Llamada a la acción)</label>
                                        <textarea
                                            value={formData.cta}
                                            onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-20"
                                            placeholder="Suscríbete, comenta, dale like..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">👋 Outro</label>
                                        <textarea
                                            value={formData.outro}
                                            onChange={(e) => setFormData({ ...formData, outro: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-20"
                                            placeholder="Despedida, teaser siguiente video..."
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800">
                                            Cancelar
                                        </button>
                                        <button type="submit" disabled={submitting} className="flex-1 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-50">
                                            {submitting ? 'Guardando...' : (editingId ? 'Guardar' : 'Crear Guion')}
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
