'use client';

import { useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import { FileText, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import BackToDashboard from '../components/BackToDashboard';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { SCRIPTS_COPY } from '../content/pages/scripts';
import useDialogFocus from '../hooks/useDialogFocus';

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
    draft: { label: SCRIPTS_COPY.statuses.draft, color: 'bg-gray-600' },
    review: { label: SCRIPTS_COPY.statuses.review, color: 'bg-yellow-600' },
    approved: { label: SCRIPTS_COPY.statuses.approved, color: 'bg-green-600' },
    recorded: { label: SCRIPTS_COPY.statuses.recorded, color: 'bg-blue-600' },
};

export default function ScriptsPage() {
    const { isAuthenticated } = useAuth();
    const authFetch = useAuthFetch();
    const { addToast } = useToast();
    const [scripts, setScripts] = useState<Script[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ title: '', intro: '', body: '', cta: '', outro: '' });
    const [deleteTarget, setDeleteTarget] = useState<Script | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [visibleCount, setVisibleCount] = useState(12);
    const modalRef = useRef<HTMLDivElement>(null);
    const deleteRef = useRef<HTMLDivElement>(null);

    useDialogFocus(modalRef, showModal);
    useDialogFocus(deleteRef, Boolean(deleteTarget));

    const fetchScripts = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            if (!isAuthenticated) {
                setScripts([]);
                return;
            }
            const response = await authFetch('/api/scripts', { signal });
            if (response.ok) setScripts(await response.json());
        } catch (err) {
            if (signal?.aborted) return;
            console.error('Error:', err);
            addToast(SCRIPTS_COPY.toasts.error, 'error');
        } finally {
            if (signal?.aborted) return;
            setLoading(false);
        }
    }, [isAuthenticated, authFetch, addToast]);

    useEffect(() => {
        const controller = new AbortController();
        fetchScripts(controller.signal);
        return () => controller.abort();
    }, [fetchScripts]);

    useEffect(() => {
        if (!showModal && !deleteTarget) return;
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowModal(false);
                setDeleteTarget(null);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [showModal, deleteTarget]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = editingId ? `/api/scripts?id=${editingId}` : '/api/scripts';
            const method = editingId ? 'PUT' : 'POST';

            const response = await authFetch(url, {
                method,
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || SCRIPTS_COPY.errors.save);
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({ title: '', intro: '', body: '', cta: '', outro: '' });
            await fetchScripts();
            addToast(editingId ? SCRIPTS_COPY.toasts.updated : SCRIPTS_COPY.toasts.created, 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : SCRIPTS_COPY.toasts.error, 'error');
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

    const deleteScript = async () => {
        if (!deleteTarget) return;
        try {
            const response = await authFetch(`/api/scripts?id=${deleteTarget.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || SCRIPTS_COPY.errors.delete);
            }
            setDeleteTarget(null);
            await fetchScripts();
            addToast(SCRIPTS_COPY.toasts.deleted, 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : SCRIPTS_COPY.toasts.error, 'error');
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
                    <motion.div
                        className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="space-y-2">
                            <BackToDashboard />
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="w-10 h-10 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                                        <FileText className="w-5 h-5" />
                                    </span>
                                    <h2 className="text-4xl font-semibold text-white">{SCRIPTS_COPY.title}</h2>
                                </div>
                                <p className="text-slate-300">{SCRIPTS_COPY.subtitle}</p>
                            </div>
                        </div>
                        <motion.button
                            onClick={() => { setEditingId(null); setFormData({ title: '', intro: '', body: '', cta: '', outro: '' }); setShowModal(true); }}
                            className="w-full px-6 py-3 text-sm font-semibold text-black rounded-lg flex items-center justify-center gap-2 sm:w-auto"
                            style={{
                                background: 'linear-gradient(135deg, rgba(246, 201, 69, 0.95), rgba(246, 201, 69, 0.7))',
                                boxShadow: '0 10px 20px rgba(246, 201, 69, 0.22)',
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Plus className="w-4 h-4" />
                            {SCRIPTS_COPY.new}
                        </motion.button>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : scripts.length === 0 ? (
                        <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-900/60 border border-gray-800 rounded-full flex items-center justify-center text-yellow-400">
                                <FileText className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{SCRIPTS_COPY.emptyTitle}</h3>
                            <p className="text-slate-300 mb-6">{SCRIPTS_COPY.emptySubtitle}</p>
                            <motion.button
                                onClick={() => { setEditingId(null); setFormData({ title: '', intro: '', body: '', cta: '', outro: '' }); setShowModal(true); }}
                                className="w-full px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 sm:w-auto"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {SCRIPTS_COPY.create}
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {scripts.slice(0, visibleCount).map((script) => (
                                <motion.div
                                    key={script.id}
                                    className="surface-panel glow-hover p-6 transition-all"
                                    whileHover={{ x: 4 }}
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`text-xs px-2 py-1 rounded ${STATUS_LABELS[script.status]?.color || 'bg-gray-600'} text-white`}>
                                                    {STATUS_LABELS[script.status]?.label || script.status}
                                                </span>
                                                <span className="text-xs text-gray-500">{script.word_count} {SCRIPTS_COPY.wordCountLabel}</span>
                                                <span className="text-xs text-yellow-400">⏱ ~{formatDuration(script.estimated_duration_seconds)}</span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-white">{script.title}</h3>
                                            {script.idea_title && (
                                                <p className="text-sm text-gray-500 mt-1">{SCRIPTS_COPY.ideaPrefix} {script.idea_title}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEdit(script)} className="px-3 py-1 text-sm text-yellow-400 hover:text-yellow-300">
                                                {SCRIPTS_COPY.edit}
                                            </button>
                                            <button onClick={() => setDeleteTarget(script)} className="px-3 py-1 text-sm text-red-400 hover:text-red-300">
                                                {SCRIPTS_COPY.delete}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {scripts.length > 12 && (
                                <div className="pt-2 flex justify-center">
                                    <button
                                        onClick={() => setVisibleCount(visibleCount < scripts.length ? scripts.length : 12)}
                                        className="text-xs px-4 py-2 rounded-full border border-gray-700 text-slate-300 hover:text-white"
                                    >
                                        {visibleCount < scripts.length ? SCRIPTS_COPY.list.showMore : SCRIPTS_COPY.list.showLess}
                                    </button>
                                </div>
                            )}
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
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="script-modal-title"
                                className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
                                ref={modalRef}
                                tabIndex={-1}
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.9 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 id="script-modal-title" className="text-2xl font-bold text-white mb-6">
                                    {editingId ? SCRIPTS_COPY.edit : SCRIPTS_COPY.new}
                                </h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{SCRIPTS_COPY.fields.title}</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{SCRIPTS_COPY.fields.intro}</label>
                                        <textarea
                                            value={formData.intro}
                                            onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-24"
                                            placeholder={SCRIPTS_COPY.placeholders.intro}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{SCRIPTS_COPY.fields.body}</label>
                                        <textarea
                                            value={formData.body}
                                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-40"
                                            placeholder={SCRIPTS_COPY.placeholders.body}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{SCRIPTS_COPY.fields.cta}</label>
                                        <textarea
                                            value={formData.cta}
                                            onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-20"
                                            placeholder={SCRIPTS_COPY.placeholders.cta}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{SCRIPTS_COPY.fields.outro}</label>
                                        <textarea
                                            value={formData.outro}
                                            onChange={(e) => setFormData({ ...formData, outro: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-20"
                                            placeholder={SCRIPTS_COPY.placeholders.outro}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800">
                                            {SCRIPTS_COPY.cancel}
                                        </button>
                                        <button type="submit" disabled={submitting} className="flex-1 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-50">
                                            {submitting ? (editingId ? SCRIPTS_COPY.submittingEdit : SCRIPTS_COPY.submittingCreate) : editingId ? SCRIPTS_COPY.submitEdit : SCRIPTS_COPY.submitCreate}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {deleteTarget && (
                        <motion.div
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteTarget(null)}
                        >
                            <motion.div
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="script-delete-title"
                                className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 sm:p-8 w-full max-w-lg"
                                ref={deleteRef}
                                tabIndex={-1}
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.9 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 id="script-delete-title" className="text-2xl font-bold text-white mb-3">{SCRIPTS_COPY.deleteTitle}</h3>
                                <p className="text-sm text-gray-400 mb-6">{SCRIPTS_COPY.deleteWarning} <span className="text-white font-semibold">{deleteTarget.title}</span>. {SCRIPTS_COPY.deleteIrreversible}</p>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800">{SCRIPTS_COPY.cancel}</button>
                                    <button onClick={deleteScript} className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500">{deleteSubmitting ? SCRIPTS_COPY.deleting : SCRIPTS_COPY.delete}</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ProtectedRoute>
    );
}
