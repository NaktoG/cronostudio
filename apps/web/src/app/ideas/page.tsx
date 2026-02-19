'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Lightbulb, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import BackToDashboard from '../components/BackToDashboard';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';
import type { Idea, IdeaFormData, IdeaUpdatePayload } from '@/domain/types';
import { IDEA_STATUSES } from '@/domain/types';
import { UI_COPY } from '@/config/uiCopy';
import { useIdeas } from '@/hooks/useIdeas';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    draft: { label: UI_COPY.ideas.statusLabels.draft, color: 'bg-gray-600' },
    approved: { label: UI_COPY.ideas.statusLabels.approved, color: 'bg-green-600' },
    in_production: { label: UI_COPY.ideas.statusLabels.in_production, color: 'bg-yellow-600' },
    completed: { label: UI_COPY.ideas.statusLabels.completed, color: 'bg-blue-600' },
    archived: { label: UI_COPY.ideas.statusLabels.archived, color: 'bg-gray-800' },
};

export default function IdeasPage() {
    const { isAuthenticated } = useAuth();
    const authFetch = useAuthFetch();
    const { ideas, loading, fetchIdeas, createIdea, updateIdea, deleteIdea } = useIdeas(authFetch, isAuthenticated);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<IdeaFormData>({ title: '', description: '', priority: 0 });
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Idea | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editSuccessId, setEditSuccessId] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }
        fetchIdeas();
    }, [isAuthenticated, fetchIdeas]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setLocalError(null);
        try {
            await createIdea(formData);
            setShowModal(false);
            setFormData({ title: '', description: '', priority: 0 });
            await fetchIdeas();
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : UI_COPY.ideas.form.submitError);
        } finally {
            setSubmitting(false);
        }
    };

    const updateStatus = async (id: string, status: Idea['status']) => {
        const payload: IdeaUpdatePayload = { status };
        await updateIdea(id, payload);
        await fetchIdeas();
    };

    const parseIdeaStatus = (value: string): Idea['status'] | null => {
        return IDEA_STATUSES.includes(value as Idea['status']) ? (value as Idea['status']) : null;
    };

    const startEdit = (idea: Idea) => {
        setEditingId(idea.id);
        setEditTitle(idea.title);
        setEditDescription(idea.description ?? '');
        setLocalError(null);
        setEditSuccessId(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditTitle('');
        setEditDescription('');
        setLocalError(null);
        setEditSuccessId(null);
    };

    const saveEdit = async (idea: Idea) => {
        if (!editTitle.trim()) {
            setLocalError(UI_COPY.ideas.edit.requiredTitle);
            return;
        }
        setEditSubmitting(true);
        setLocalError(null);
        try {
            const payload: IdeaUpdatePayload = {
                title: editTitle.trim(),
                description: editDescription.trim() ? editDescription.trim() : null,
            };
            await updateIdea(idea.id, payload);
            cancelEdit();
            setEditSuccessId(idea.id);
            await fetchIdeas();
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : UI_COPY.ideas.edit.updateError);
        } finally {
            setEditSubmitting(false);
        }
    };

    const requestDelete = async (id: string) => {
        const target = ideas.find((idea) => idea.id === id) || null;
        setDeleteTarget(target);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteSubmitting(true);
        try {
            await deleteIdea(deleteTarget.id);
            setDeleteTarget(null);
            await fetchIdeas();
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : UI_COPY.ideas.form.submitError);
        } finally {
            setDeleteSubmitting(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
                    <motion.div
                        className="flex items-center justify-between mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div>
                            <BackToDashboard />
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-10 h-10 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                                    <Lightbulb className="w-5 h-5" />
                                </span>
                                <h2 className="text-4xl font-semibold text-white">{UI_COPY.ideas.title}</h2>
                            </div>
                            <p className="text-slate-300">{UI_COPY.ideas.description}</p>
                        </div>
                        <motion.button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-3 text-sm font-semibold text-black rounded-lg flex items-center gap-2"
                            style={{
                                background: 'linear-gradient(135deg, rgba(246, 201, 69, 0.95), rgba(246, 201, 69, 0.7))',
                                boxShadow: '0 10px 20px rgba(246, 201, 69, 0.22)',
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Plus className="w-4 h-4" />
                            {UI_COPY.ideas.createLabel}
                        </motion.button>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : ideas.length === 0 ? (
                        <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-900/60 border border-gray-800 rounded-full flex items-center justify-center text-yellow-400">
                                <Lightbulb className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{UI_COPY.ideas.emptyTitle}</h3>
                            <p className="text-slate-300">{UI_COPY.ideas.emptyDescription}</p>
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
                                    className="surface-panel glow-hover p-6 transition-all group"
                                    whileHover={{ y: -4 }}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`text-xs px-2 py-1 rounded ${STATUS_LABELS[idea.status]?.color || 'bg-gray-600'} text-white`}>
                                            {STATUS_LABELS[idea.status]?.label || idea.status}
                                        </span>
                                        <span className="text-xs text-yellow-400">★ {idea.priority}</span>
                                    </div>
                                    {editingId === idea.id ? (
                                        <div className="space-y-3 mb-4">
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
                                            />
                                            <textarea
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none h-20"
                                                placeholder={UI_COPY.ideas.form.descriptionLabel}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                                                {idea.title}
                                            </h3>
                                            {idea.description && (
                                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{idea.description}</p>
                                            )}
                                            {editSuccessId === idea.id && (
                                                <p className="text-xs text-emerald-400" aria-live="polite">
                                                    {UI_COPY.ideas.edit.successLabel}
                                                </p>
                                            )}
                                        </>
                                    )}
                                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800">
                                        <select
                                            value={idea.status}
                                            onChange={(e) => {
                                                const nextStatus = parseIdeaStatus(e.target.value);
                                                if (nextStatus) {
                                                    updateStatus(idea.id, nextStatus);
                                                }
                                            }}
                                            className="flex-1 text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
                                        >
                                            <option value="draft">{UI_COPY.ideas.statusLabels.draft}</option>
                                            <option value="approved">{UI_COPY.ideas.statusLabels.approved}</option>
                                            <option value="in_production">{UI_COPY.ideas.statusLabels.in_production}</option>
                                            <option value="completed">{UI_COPY.ideas.statusLabels.completed}</option>
                                            <option value="archived">{UI_COPY.ideas.statusLabels.archived}</option>
                                        </select>
                                        {editingId === idea.id ? (
                                            <>
                                                <button
                                                    onClick={() => saveEdit(idea)}
                                                    disabled={editSubmitting}
                                                    className="text-yellow-400 hover:text-yellow-300 text-xs px-2 disabled:opacity-50"
                                                >
                                                    {UI_COPY.ideas.edit.saveLabel}
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="text-slate-400 hover:text-slate-300 text-xs px-2"
                                                >
                                                    {UI_COPY.ideas.edit.cancelLabel}
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => startEdit(idea)}
                                                    className="text-yellow-400 hover:text-yellow-300 text-xs px-2"
                                                >
                                                    {UI_COPY.ideas.edit.editLabel}
                                                </button>
                                                <button
                                                    onClick={() => requestDelete(idea.id)}
                                                    className="text-red-400 hover:text-red-300 text-xs px-2"
                                                >
                                                    {UI_COPY.ideas.delete.label}
                                                </button>
                                            </>
                                        )}
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
                                <h3 className="text-2xl font-bold text-white mb-6">{UI_COPY.ideas.createLabel}</h3>
                                {localError && <p className="text-red-400 text-sm mb-4" aria-live="polite">{localError}</p>}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{UI_COPY.ideas.form.titleLabel}</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            placeholder={UI_COPY.ideas.form.titleLabel}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{UI_COPY.ideas.form.descriptionLabel}</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-24"
                                            placeholder={UI_COPY.ideas.form.descriptionLabel}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{UI_COPY.ideas.form.priorityLabel}</label>
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
                                            {UI_COPY.ideas.form.cancel}
                                        </button>
                                        <button type="submit" disabled={submitting} className="flex-1 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-50">
                                            {submitting ? UI_COPY.ideas.form.creating : UI_COPY.ideas.form.create}
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
                                className="bg-gray-900 border border-red-500/20 rounded-2xl p-6 w-full max-w-md"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="text-xl font-bold text-white mb-2">{UI_COPY.ideas.delete.title}</h3>
                                <p className="text-gray-400 text-sm mb-6">
                                    {UI_COPY.ideas.delete.confirm} <span className="text-white font-semibold">{deleteTarget.title}</span>?
                                    {UI_COPY.ideas.delete.confirmSuffix}
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTarget(null)}
                                        className="flex-1 py-2.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800"
                                    >
                                        {UI_COPY.ideas.form.cancel}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmDelete}
                                        disabled={deleteSubmitting}
                                        className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-400 disabled:opacity-60"
                                    >
                                        {deleteSubmitting ? UI_COPY.ideas.delete.deleting : UI_COPY.ideas.delete.label}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ProtectedRoute>
    );
}
