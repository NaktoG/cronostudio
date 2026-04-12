'use client';

import { Suspense, useState, useEffect, FormEvent, useRef } from 'react';
import { Lightbulb, Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import BackToDashboard from '../components/BackToDashboard';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLocale } from '../contexts/LocaleContext';
import { getIdeasCopy } from '../content/pages/ideas';
import { IdeaStatus, IDEA_STATUS_BADGES, getIdeaStatusLabels } from '@/app/content/status/ideas';
import useDialogFocus from '../hooks/useDialogFocus';
import Link from 'next/link';
import { useChannels } from '@/app/hooks/useChannels';
import { useIdeas } from '@/app/ideas/hooks/useIdeas';
import type { Idea } from '@/app/ideas/hooks/useIdeas';
import { evaluateIdeaReady } from '@/lib/ideaReady';

function IdeasContent() {
    const { isAuthenticated } = useAuth();
    const { locale } = useLocale();
    const ideasCopy = getIdeasCopy(locale);
    const statusLabels = getIdeaStatusLabels(locale);
    const authFetch = useAuthFetch();
    const { addToast } = useToast();
    const { channels } = useChannels({ isAuthenticated, authFetch });
    const { state, actions } = useIdeas({ isAuthenticated, authFetch, addToast, ideasCopy });
    const { ideas, loading, listError, selectedChannel, selectedIds, statusErrors, pipelineLoading, tagSuggestions, openNewRef } = state;
    const { setSelectedChannel, refreshIdeas, toggleSelection, clearSelection, createOrUpdateIdea, deleteIdea: deleteIdeaAction, updateStatus, updateSelectedStatus, runPipeline } = actions;
    const [showModal, setShowModal] = useState(false);
    const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 0,
        channelId: '',
        tagsInput: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Idea | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);
    const [visibleCount, setVisibleCount] = useState(12);
    const modalRef = useRef<HTMLDivElement>(null);
    const deleteRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();

    useDialogFocus(modalRef, showModal);
    useDialogFocus(deleteRef, Boolean(deleteTarget));

    useEffect(() => {
        if (openNewRef.current) return;
        if (searchParams?.get('new') === '1') {
            openNewRef.current = true;
            setEditingIdea(null);
            setError(null);
            setFormData({ title: '', description: '', priority: 0, channelId: '', tagsInput: '' });
            setShowModal(true);
        }
    }, [searchParams, openNewRef]);

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
        setError(null);
        try {
            await createOrUpdateIdea({
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                channelId: formData.channelId || undefined,
                tagsInput: formData.tagsInput,
            }, editingIdea?.id);
            setShowModal(false);
            setEditingIdea(null);
            setFormData({ title: '', description: '', priority: 0, channelId: '', tagsInput: '' });
         addToast(editingIdea ? ideasCopy.toasts.updated : ideasCopy.toasts.created, 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : ideasCopy.toasts.error, 'error');
            setError(err instanceof Error ? err.message : ideasCopy.toasts.error);
        } finally {
            setSubmitting(false);
        }
    };

    const readinessPreview = evaluateIdeaReady(formData.title, formData.description);
    const startEdit = (idea: Idea) => {
        setEditingIdea(idea);
        setFormData({
            title: idea.title,
            description: idea.description ?? '',
            priority: idea.priority ?? 0,
            channelId: idea.channelId ?? '',
            tagsInput: Array.isArray(idea.tags) ? idea.tags.join(', ') : '',
        });
        setShowModal(true);
    };

    const openDelete = (idea: Idea) => {
        setDeleteTarget(idea);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteSubmitting(true);
        try {
            await deleteIdeaAction(deleteTarget.id);
            setDeleteTarget(null);
            addToast(ideasCopy.toasts.deleted, 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : ideasCopy.toasts.error, 'error');
            setError(err instanceof Error ? err.message : ideasCopy.toasts.error);
        } finally {
            setDeleteSubmitting(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
                    <h1 className="sr-only">{ideasCopy.title}</h1>
                    <motion.div
                        className="flex flex-col gap-4 mb-6 sm:mb-8 sm:flex-row sm:items-center sm:justify-between"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div>
                            <BackToDashboard />
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-10 h-10 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                                    <Lightbulb className="w-5 h-5" />
                                </span>
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">{ideasCopy.title}</h2>
                            </div>
                            <p className="text-sm sm:text-base text-slate-300">{ideasCopy.subtitle}</p>
                        </div>
                        <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row sm:flex-wrap sm:items-end">
                            {channels.length > 0 && (
                                <div className="min-w-[220px]">
                                    <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">{ideasCopy.controls.channel}</label>
                                    <select
                                        value={selectedChannel}
                                        onChange={(event) => {
                                            const next = event.target.value;
                                            setSelectedChannel(next);
                                            if (typeof window !== 'undefined') {
                                                window.localStorage.setItem('cronostudio.channelId', next);
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 bg-gray-900/70 border border-gray-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-yellow-400"
                                    >
                                        <option value="">{ideasCopy.controls.allChannels}</option>
                                        {channels.map((channel) => (
                                            <option key={channel.id} value={channel.id}>
                                                {channel.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {selectedIds.length > 0 && (
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <span className="text-xs text-slate-400">{selectedIds.length} {ideasCopy.controls.selectedCount}</span>
                                    <button
                                        type="button"
                                        onClick={() => updateSelectedStatus('approved')}
                                        className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                                    >
                                        {ideasCopy.controls.approve}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateSelectedStatus('archived')}
                                        className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                                    >
                                        {ideasCopy.controls.archive}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearSelection}
                                        className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                                    >
                                        {ideasCopy.controls.clear}
                                    </button>
                                </div>
                            )}
                            <motion.button
                                onClick={() => {
                                    setEditingIdea(null);
                                    setError(null);
                                    setFormData({ title: '', description: '', priority: 0, channelId: '', tagsInput: '' });
                                    setShowModal(true);
                                }}
                                className="w-full px-6 py-3 text-sm font-semibold text-black rounded-lg flex items-center justify-center gap-2 sm:w-auto sm:self-end"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(246, 201, 69, 0.95), rgba(246, 201, 69, 0.7))',
                                    boxShadow: '0 10px 20px rgba(246, 201, 69, 0.22)',
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Plus className="w-4 h-4" />
                                {ideasCopy.new}
                            </motion.button>
                        </div>
                    </motion.div>

                    {listError && !loading && (
                        <motion.div
                            className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <span>{listError}</span>
                                <button
                                    type="button"
                                    onClick={() => refreshIdeas()}
                                    className="text-xs font-semibold text-yellow-300 hover:text-yellow-200"
                                >
                                    {ideasCopy.controls.retry}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : ideas.length === 0 ? (
                        <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-900/60 border border-gray-800 rounded-full flex items-center justify-center text-yellow-400">
                                <Lightbulb className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{ideasCopy.emptyTitle}</h3>
                            <p className="text-slate-300 mb-6">{ideasCopy.emptySubtitle}</p>
                            <motion.button
                                onClick={() => {
                                    setEditingIdea(null);
                                    setError(null);
                                    setFormData({ title: '', description: '', priority: 0, channelId: '', tagsInput: '' });
                                    setShowModal(true);
                                }}
                                className="w-full px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 sm:w-auto"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {ideasCopy.create}
                            </motion.button>
                        </motion.div>
                    ) : (
                        <div className="space-y-4">
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {ideas.slice(0, visibleCount).map((idea) => (
                                    <motion.div
                                        key={idea.id}
                                        className="surface-panel glow-hover p-6 transition-all group min-w-0"
                                        whileHover={{ y: -4 }}
                                    >
                                    <div className="flex items-start justify-between mb-3">
                                        <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(idea.id)}
                                                onChange={() => toggleSelection(idea.id)}
                                                aria-label={`${ideasCopy.ideaCard.selectAriaPrefix} ${idea.title}`}
                                                className="h-4 w-4 rounded border-gray-700 text-yellow-400 focus:ring-yellow-400"
                                            />
                                            {ideasCopy.ideaCard.select}
                                        </label>
                                        <span className={`text-xs px-2 py-1 rounded ${IDEA_STATUS_BADGES[idea.status] || 'bg-gray-600'} text-white`}>
                                            {statusLabels[idea.status] || idea.status}
                                        </span>
                                        <span className="text-xs text-yellow-400">★ {idea.priority}</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors break-words">
                                        {idea.title}
                                    </h3>
                                    {idea.description && (
                                        <p className="text-gray-400 text-sm mb-3 line-clamp-3 sm:line-clamp-2">{idea.description}</p>
                                    )}
                                    {idea.channelName && (
                                        <p className="text-xs text-slate-400">{ideasCopy.channelPrefix} {idea.channelName}</p>
                                    )}
                                    {idea.tags?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {idea.tags.map((tag) => (
                                                <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="mt-4 pt-4 border-t border-gray-800 flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <select
                                            value={idea.status}
                                            onChange={(e) => updateStatus(idea.id, e.target.value as IdeaStatus)}
                                            className="w-full text-xs bg-gray-800 border border-gray-700 rounded px-2 py-2 text-white sm:flex-1"
                                        >
                                        <option value="draft">{statusLabels.draft}</option>
                                        <option value="approved">{statusLabels.approved}</option>
                                        <option value="in_production">{statusLabels.in_production}</option>
                                        <option value="completed">{statusLabels.completed}</option>
                                        <option value="archived">{statusLabels.archived}</option>
                                        </select>
                                        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                                            <button
                                                type="button"
                                                onClick={() => runPipeline(idea)}
                                                disabled={pipelineLoading.includes(idea.id)}
                                                className="text-sky-300 hover:text-sky-200 text-xs px-2 disabled:opacity-60"
                                            >
                                                {pipelineLoading.includes(idea.id) ? ideasCopy.ideaCard.pipelineRunning : ideasCopy.ideaCard.pipelineAi}
                                            </button>
                                            <Link
                                                href={`/ai?profile=script_architect&ideaId=${idea.id}${idea.channelId ? `&channelId=${idea.channelId}` : selectedChannel ? `&channelId=${selectedChannel}` : ''}`}
                                                className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 text-xs px-2"
                                            >
                                                <Sparkles className="w-3 h-3" />
                                                {ideasCopy.ideaCard.scriptAi}
                                            </Link>
                                            <button
                                                onClick={() => startEdit(idea)}
                                                className="text-yellow-300 hover:text-yellow-200 text-xs px-2"
                                            >
                                                {ideasCopy.edit}
                                            </button>
                                            <button
                                                onClick={() => openDelete(idea)}
                                                className="text-red-400 hover:text-red-300 text-xs px-2"
                                            >
                                                {ideasCopy.delete}
                                            </button>
                                        </div>
                                    </div>
                                    {statusErrors[idea.id]?.length > 0 && (
                                        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                                            <div className="font-semibold mb-1">{ideasCopy.errors.ideaNotReadyTitle}</div>
                                            <ul className="list-disc pl-4 space-y-1">
                                                {statusErrors[idea.id].map((item) => (
                                                    <li key={item}>{item}</li>
                                                ))}
                                            </ul>
                                            <button
                                                type="button"
                                                onClick={() => startEdit(idea)}
                                                className="mt-2 text-xs font-semibold text-yellow-300 hover:text-yellow-200"
                                            >
                                                {ideasCopy.ideaCard.completeIdea}
                                            </button>
                                        </div>
                                    )}
                                    </motion.div>
                                ))}
                            </motion.div>
                            {ideas.length > 12 && (
                                <div className="pt-2 flex justify-center">
                                    <button
                                        onClick={() => setVisibleCount(visibleCount < ideas.length ? ideas.length : 12)}
                                        className="text-xs px-4 py-2 rounded-full border border-gray-700 text-slate-300 hover:text-white"
                                    >
                                        {visibleCount < ideas.length ? ideasCopy.list.showMore : ideasCopy.list.showLess}
                                    </button>
                                </div>
                            )}
                        </div>
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
                                aria-labelledby="idea-modal-title"
                                className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-6 sm:p-8 w-full max-w-md max-h-[85vh] overflow-y-auto"
                                ref={modalRef}
                                tabIndex={-1}
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.9 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 id="idea-modal-title" className="text-2xl font-bold text-white mb-6">
                                    {editingIdea ? ideasCopy.edit : ideasCopy.new}
                                </h3>
                                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{ideasCopy.form.title}</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            placeholder={ideasCopy.form.placeholderTitle}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{ideasCopy.form.description}</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-24"
                                            placeholder={ideasCopy.form.placeholderDescription}
                                        />
                                        <div className="mt-3 rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2 text-xs text-slate-300">
                                            <div className="font-semibold text-slate-200">{ideasCopy.checklist.title}</div>
                                            <ul className="mt-2 space-y-1">
                                                <li className={readinessPreview.errors.includes(ideasCopy.checklist.promiseError) ? 'text-red-300' : 'text-emerald-300'}>
                                                    {ideasCopy.checklist.promise}
                                                </li>
                                                <li className={readinessPreview.errors.includes(ideasCopy.checklist.bulletsError) ? 'text-red-300' : 'text-emerald-300'}>
                                                    {ideasCopy.checklist.bullets}
                                                </li>
                                                <li className={readinessPreview.errors.includes(ideasCopy.checklist.hookError) ? 'text-red-300' : 'text-emerald-300'}>
                                                    {ideasCopy.checklist.hook}
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{ideasCopy.form.channel}</label>
                                        <select
                                            value={formData.channelId}
                                            onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                        >
                                            <option value="">{ideasCopy.form.noChannel}</option>
                                            {channels.map((channel) => (
                                                <option key={channel.id} value={channel.id}>
                                                    {channel.name}
                                                </option>
                                            ))}
                                        </select>
                                        {selectedChannel && !formData.channelId && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, channelId: selectedChannel })}
                                                className="mt-2 text-xs text-yellow-300 hover:text-yellow-200"
                                            >
                                                {ideasCopy.ideaCard.useSelectedChannel}
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{ideasCopy.form.priority}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{ideasCopy.form.tags}</label>
                                        <datalist id="idea-tag-options">
                                            {tagSuggestions.map((tag) => (
                                                <option key={tag} value={tag} />
                                            ))}
                                        </datalist>
                                        <input
                                            type="text"
                                            value={formData.tagsInput}
                                            onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                                            list="idea-tag-options"
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            placeholder={ideasCopy.form.placeholderTags}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800">
                                            {ideasCopy.cancel}
                                        </button>
                                        <button type="submit" disabled={submitting} className="flex-1 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-50">
                                            {submitting ? (editingIdea ? ideasCopy.saving : ideasCopy.creating) : editingIdea ? ideasCopy.save : ideasCopy.new}
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
                                aria-labelledby="idea-delete-title"
                                className="bg-gray-900 border border-red-500/20 rounded-2xl p-6 sm:p-8 w-full max-w-md"
                                ref={deleteRef}
                                tabIndex={-1}
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 id="idea-delete-title" className="text-xl font-bold text-white mb-2">{ideasCopy.deleteTitle}</h3>
                                <p className="text-gray-400 text-sm mb-6">
                                    {ideasCopy.deleteConfirm} <span className="text-white font-semibold">{deleteTarget.title}</span>?
                                    {ideasCopy.deleteIrreversible}
                                </p>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTarget(null)}
                                        className="flex-1 py-2.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800"
                                    >
                                        {ideasCopy.cancel}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmDelete}
                                        disabled={deleteSubmitting}
                                        className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-400 disabled:opacity-60"
                                    >
                                        {deleteSubmitting ? ideasCopy.deleting : ideasCopy.delete}
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

export default function IdeasPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex flex-col" />}>
            <IdeasContent />
        </Suspense>
    );
}
