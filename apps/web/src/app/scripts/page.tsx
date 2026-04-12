'use client';

import { Suspense, useState, useEffect, FormEvent, useRef, useMemo, useCallback } from 'react';
import { Clipboard, FileText, Link as LinkIcon, Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import BackToDashboard from '../components/BackToDashboard';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLocale } from '../contexts/LocaleContext';
import { getScriptsCopy } from '../content/pages/scripts';
import useDialogFocus from '../hooks/useDialogFocus';
import Link from 'next/link';
import { copyScriptToClipboard, downloadScriptMarkdown, exportScriptToPdf } from '@/lib/scripts/export';
import { calculateScriptMetrics } from '@/lib/scripts/metrics';
import { SCRIPT_STATUS_BADGES, getScriptStatusLabels } from '@/app/content/status/scripts';
import { useChannels } from '@/app/hooks/useChannels';
import { useScripts } from '@/app/scripts/hooks/useScripts';
import type { Script } from '@/app/scripts/hooks/useScripts';

function ScriptsContent() {
    const { isAuthenticated } = useAuth();
    const { locale } = useLocale();
    const scriptsCopy = getScriptsCopy(locale);
    const statusLabels = getScriptStatusLabels(locale);
    const authFetch = useAuthFetch();
    const { addToast } = useToast();
    const { channels } = useChannels({ isAuthenticated, authFetch });
    const { state, actions } = useScripts({ isAuthenticated, authFetch, addToast, scriptsCopy });
    const { scripts, ideaOptions, loading, listError, selectedChannel, selectedIds, pipelineLoading } = state;
    const { setSelectedChannel, refreshScripts, toggleSelection, clearSelection, createOrUpdateScript, deleteScript: deleteScriptAction, updateSelectedStatus, runPipeline } = actions;
    const [ideaTitleInput, setIdeaTitleInput] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ title: '', intro: '', body: '', cta: '', outro: '', ideaId: '' });
    const [error, setError] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Script | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [visibleCount, setVisibleCount] = useState(12);
    const openNewRef = useRef(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const deleteRef = useRef<HTMLDivElement>(null);
    const shareHandledRef = useRef(false);
    const searchParams = useSearchParams();

    useDialogFocus(modalRef, showModal);
    useDialogFocus(deleteRef, Boolean(deleteTarget));

    useEffect(() => {
        if (openNewRef.current) return;
        if (searchParams?.get('new') === '1') {
            openNewRef.current = true;
            setEditingId(null);
            setFormData({ title: '', intro: '', body: '', cta: '', outro: '', ideaId: '' });
            setIdeaTitleInput('');
            setError(null);
            setShowModal(true);
        }
    }, [searchParams]);

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
            const payload = {
                title: formData.title,
                intro: formData.intro,
                body: formData.body,
                cta: formData.cta,
                outro: formData.outro,
                ...(formData.ideaId ? { ideaId: formData.ideaId } : {}),
            };
            await createOrUpdateScript(payload, editingId ?? undefined);
            setShowModal(false);
            setEditingId(null);
            setFormData({ title: '', intro: '', body: '', cta: '', outro: '', ideaId: '' });
            setIdeaTitleInput('');
            setError(null);
            addToast(editingId ? scriptsCopy.toasts.updated : scriptsCopy.toasts.created, 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : scriptsCopy.toasts.error, 'error');
            setError(err instanceof Error ? err.message : scriptsCopy.toasts.error);
        } finally {
            setSubmitting(false);
        }
    };

    const scriptChecklist = useMemo(() => calculateScriptMetrics({
        intro: formData.intro,
        body: formData.body,
        cta: formData.cta,
        outro: formData.outro,
    }), [formData]);

    const handleCopyScript = async () => {
        try {
            await copyScriptToClipboard({
                title: formData.title,
                intro: formData.intro,
                body: formData.body,
                cta: formData.cta,
                outro: formData.outro,
            });
            addToast(scriptsCopy.toasts.copiedScript, 'success');
        } catch {
            addToast(scriptsCopy.toasts.copyScriptError, 'error');
        }
    };

    const handleCopyShareLink = async () => {
        if (!editingId || typeof window === 'undefined') return;
        const url = `${window.location.origin}/scripts?scriptId=${editingId}`;
        try {
            await navigator.clipboard.writeText(url);
            addToast(scriptsCopy.toasts.copiedLink, 'success');
        } catch {
            addToast(scriptsCopy.toasts.copyLinkError, 'error');
        }
    };

    const handleDownloadScript = () => {
        downloadScriptMarkdown({
            title: formData.title,
            intro: formData.intro,
            body: formData.body,
            cta: formData.cta,
            outro: formData.outro,
        });
    };

    const handleExportPdf = () => {
        if (typeof window === 'undefined') return;
        const ok = exportScriptToPdf({
            title: formData.title,
            intro: formData.intro,
            body: formData.body,
            cta: formData.cta,
            outro: formData.outro,
        });
        if (!ok) {
            addToast(scriptsCopy.toasts.exportWindowError, 'error');
        }
    };

    const openEdit = useCallback((script: Script) => {
        const ideaTitle = script.idea_id
            ? ideaOptions.find((idea) => idea.id === script.idea_id)?.title ?? ''
            : '';
        setIdeaTitleInput(ideaTitle);
        setError(null);
        setFormData({
            title: script.title,
            intro: script.intro || '',
            body: script.body || '',
            cta: script.cta || '',
            outro: script.outro || '',
            ideaId: script.idea_id || '',
        });
        setEditingId(script.id);
        setShowModal(true);
    }, [ideaOptions]);

    useEffect(() => {
        if (shareHandledRef.current) return;
        const targetId = searchParams?.get('scriptId');
        if (!targetId) return;
        const target = scripts.find((script) => script.id === targetId);
        if (!target) return;
        shareHandledRef.current = true;
        openEdit(target);
    }, [searchParams, scripts, openEdit]);

    const deleteScript = async () => {
        if (!deleteTarget) return;
        try {
            await deleteScriptAction(deleteTarget.id);
            setDeleteTarget(null);
            addToast(scriptsCopy.toasts.deleted, 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : scriptsCopy.toasts.error, 'error');
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
                <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
                    <h1 className="sr-only">{scriptsCopy.title}</h1>
                    <motion.div
                        className="flex flex-col gap-4 mb-6 sm:mb-8 sm:flex-row sm:items-center sm:justify-between"
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
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">{scriptsCopy.title}</h2>
                                </div>
                                <p className="text-sm sm:text-base text-slate-300">{scriptsCopy.subtitle}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row sm:flex-wrap sm:items-end">
                            {channels.length > 0 && (
                                <div className="min-w-[220px]">
                                    <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">{scriptsCopy.controls.channel}</label>
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
                                        <option value="">{scriptsCopy.controls.allChannels}</option>
                                        {channels.map((channel) => (
                                            <option key={channel.id} value={channel.id}>
                                                {channel.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {selectedIds.length > 0 && (
                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                                    <span className="text-xs text-slate-400">{selectedIds.length} {scriptsCopy.controls.selectedCount}</span>
                                    <button
                                        type="button"
                                        onClick={() => updateSelectedStatus('review')}
                                        className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                                    >
                                        {scriptsCopy.controls.toReview}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateSelectedStatus('approved')}
                                        className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                                    >
                                        {scriptsCopy.controls.approve}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateSelectedStatus('recorded')}
                                        className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                                    >
                                        {scriptsCopy.controls.recorded}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearSelection}
                                        className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                                    >
                                        {scriptsCopy.controls.clear}
                                    </button>
                                </div>
                            )}
                            <motion.button
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({ title: '', intro: '', body: '', cta: '', outro: '', ideaId: '' });
                                    setIdeaTitleInput('');
                                    setError(null);
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
                                {scriptsCopy.new}
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
                                    onClick={() => refreshScripts()}
                                    className="text-xs font-semibold text-yellow-300 hover:text-yellow-200"
                                >
                                    {scriptsCopy.controls.retry}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : scripts.length === 0 ? (
                        <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-900/60 border border-gray-800 rounded-full flex items-center justify-center text-yellow-400">
                                <FileText className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{scriptsCopy.emptyTitle}</h3>
                            <p className="text-slate-300 mb-6">{scriptsCopy.emptySubtitle}</p>
                            <motion.button
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({ title: '', intro: '', body: '', cta: '', outro: '', ideaId: '' });
                                    setIdeaTitleInput('');
                                    setError(null);
                                    setShowModal(true);
                                }}
                                className="w-full px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 sm:w-auto"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {scriptsCopy.create}
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {scripts.slice(0, visibleCount).map((script) => (
                                <motion.div
                                    key={script.id}
                                    className={`surface-panel glow-hover p-6 transition-all min-w-0 ${selectedIds.includes(script.id) ? 'ring-2 ring-yellow-400/60' : ''}`}
                                    whileHover={{ x: 4 }}
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(script.id)}
                                                        onChange={() => toggleSelection(script.id)}
                                                        aria-label={`${scriptsCopy.card.selectPrefix} ${script.title}`}
                                                        className="h-4 w-4 rounded border-gray-700 text-yellow-400 focus:ring-yellow-400"
                                                    />
                                                    {scriptsCopy.card.select}
                                                </label>
                                                <span className={`text-xs px-2 py-1 rounded ${SCRIPT_STATUS_BADGES[script.status as keyof typeof SCRIPT_STATUS_BADGES] || 'bg-gray-600'} text-white`}>
                                                    {statusLabels[script.status as keyof typeof statusLabels] || script.status}
                                                </span>
                                                <span className="text-xs text-gray-500">{script.word_count} {scriptsCopy.wordCountLabel}</span>
                                                <span className="text-xs text-yellow-400">{scriptsCopy.card.durationPrefix}{formatDuration(script.estimated_duration_seconds)}</span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-white break-words">{script.title}</h3>
                                            {script.idea_title && (
                                                <p className="text-sm text-gray-500 mt-1">{scriptsCopy.ideaPrefix} {script.idea_title}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => runPipeline(script)}
                                                disabled={pipelineLoading.includes(script.id)}
                                                className="text-sky-300 hover:text-sky-200 text-xs px-2 disabled:opacity-60"
                                            >
                                                {pipelineLoading.includes(script.id) ? scriptsCopy.card.pipelineRunning : scriptsCopy.card.pipelinePublish}
                                            </button>
                                            <Link
                                                href={`/ai?profile=retention_editor&scriptId=${script.id}${selectedChannel ? `&channelId=${selectedChannel}` : ''}`}
                                                className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 text-xs px-2"
                                            >
                                                <Sparkles className="w-3 h-3" />
                                                {scriptsCopy.card.retention}
                                            </Link>
                                            <Link
                                                href={`/ai?profile=titles_thumbs&scriptId=${script.id}${script.idea_id ? `&ideaId=${script.idea_id}` : ''}${selectedChannel ? `&channelId=${selectedChannel}` : ''}`}
                                                className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200 text-xs px-2"
                                            >
                                                <Sparkles className="w-3 h-3" />
                                                {scriptsCopy.card.seoTitles}
                                            </Link>
                                            <button onClick={() => openEdit(script)} className="px-3 py-1 text-sm text-yellow-400 hover:text-yellow-300">
                                                {scriptsCopy.edit}
                                            </button>
                                            <button onClick={() => setDeleteTarget(script)} className="px-3 py-1 text-sm text-red-400 hover:text-red-300">
                                                {scriptsCopy.delete}
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
                                        {visibleCount < scripts.length ? scriptsCopy.list.showMore : scriptsCopy.list.showLess}
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
                                    {editingId ? scriptsCopy.edit : scriptsCopy.new}
                                </h3>
                                {error && (
                                    <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                        {error}
                                    </div>
                                )}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <datalist id="idea-options">
                                        {ideaOptions.map((idea) => (
                                            <option key={idea.id} value={idea.id}>{idea.title}</option>
                                        ))}
                                    </datalist>
                                    <datalist id="idea-title-options">
                                        {ideaOptions.map((idea) => (
                                            <option key={idea.id} value={idea.title} />
                                        ))}
                                    </datalist>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{scriptsCopy.modal.ideaIdOptional}</label>
                                        <input
                                            type="text"
                                            value={formData.ideaId}
                                            onChange={(e) => setFormData({ ...formData, ideaId: e.target.value })}
                                            list="idea-options"
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            placeholder={scriptsCopy.modal.ideaIdPlaceholder}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{scriptsCopy.modal.ideaByTitle}</label>
                                        <input
                                            type="text"
                                            value={ideaTitleInput}
                                            onChange={(e) => {
                                                const next = e.target.value;
                                                setIdeaTitleInput(next);
                                                const match = ideaOptions.find((idea) => idea.title.toLowerCase() === next.toLowerCase());
                                                if (match) {
                                                    setFormData((prev) => ({ ...prev, ideaId: match.id }));
                                                }
                                            }}
                                            list="idea-title-options"
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            placeholder={scriptsCopy.modal.ideaByTitlePlaceholder}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{scriptsCopy.fields.title}</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{scriptsCopy.fields.intro}</label>
                                        <textarea
                                            value={formData.intro}
                                            onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-24"
                                            placeholder={scriptsCopy.placeholders.intro}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{scriptsCopy.fields.body}</label>
                                        <textarea
                                            value={formData.body}
                                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-40"
                                            placeholder={scriptsCopy.placeholders.body}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{scriptsCopy.fields.cta}</label>
                                        <textarea
                                            value={formData.cta}
                                            onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-20"
                                            placeholder={scriptsCopy.placeholders.cta}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{scriptsCopy.fields.outro}</label>
                                        <textarea
                                            value={formData.outro}
                                            onChange={(e) => setFormData({ ...formData, outro: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-20"
                                            placeholder={scriptsCopy.placeholders.outro}
                                        />
                                    </div>
                                    <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{scriptsCopy.modal.quickChecklist}</p>
                                                <p className="text-sm text-slate-300">{scriptsCopy.modal.scoreLabel}: {scriptChecklist.score}%</p>
                                                <p className="text-xs text-slate-500">{scriptChecklist.wordCount} palabras · ~{scriptChecklist.estimatedSeconds}s</p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleCopyScript}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-800 px-3 py-2 text-xs text-slate-200 hover:border-yellow-500/40"
                                                >
                                                    <Clipboard className="h-4 w-4" />
                                                    {scriptsCopy.modal.copyScript}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleCopyShareLink}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-800 px-3 py-2 text-xs text-slate-200 hover:border-yellow-500/40"
                                                >
                                                    <LinkIcon className="h-4 w-4" />
                                                    {scriptsCopy.modal.copyLink}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleDownloadScript}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-800 px-3 py-2 text-xs text-slate-200 hover:border-yellow-500/40"
                                                >
                                                    {scriptsCopy.modal.downloadMd}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleExportPdf}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-800 px-3 py-2 text-xs text-slate-200 hover:border-yellow-500/40"
                                                >
                                                    {scriptsCopy.modal.exportPdf}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                                            <div className={`rounded-lg border px-3 py-2 ${scriptChecklist.introReady ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-gray-800 bg-gray-900/40'}`}>
                                                {scriptsCopy.modal.intro} {scriptChecklist.introReady ? scriptsCopy.modal.ok : scriptsCopy.modal.pending}
                                            </div>
                                            <div className={`rounded-lg border px-3 py-2 ${scriptChecklist.bodyReady ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-gray-800 bg-gray-900/40'}`}>
                                                {scriptsCopy.modal.body} {scriptChecklist.bodyReady ? scriptsCopy.modal.ok : scriptsCopy.modal.pending}
                                            </div>
                                            <div className={`rounded-lg border px-3 py-2 ${scriptChecklist.ctaReady ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-gray-800 bg-gray-900/40'}`}>
                                                {scriptsCopy.modal.cta} {scriptChecklist.ctaReady ? scriptsCopy.modal.ok : scriptsCopy.modal.pending}
                                            </div>
                                            <div className={`rounded-lg border px-3 py-2 ${scriptChecklist.outroReady ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-gray-800 bg-gray-900/40'}`}>
                                                {scriptsCopy.modal.outro} {scriptChecklist.outroReady ? scriptsCopy.modal.ok : scriptsCopy.modal.pending}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowModal(false);
                                                setError(null);
                                            }}
                                            className="flex-1 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800"
                                        >
                                            {scriptsCopy.cancel}
                                        </button>
                                        <button type="submit" disabled={submitting} className="flex-1 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-50">
                                            {submitting ? (editingId ? scriptsCopy.submittingEdit : scriptsCopy.submittingCreate) : editingId ? scriptsCopy.submitEdit : scriptsCopy.submitCreate}
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
                                <h3 id="script-delete-title" className="text-2xl font-bold text-white mb-3">{scriptsCopy.deleteTitle}</h3>
                                <p className="text-sm text-gray-400 mb-6">{scriptsCopy.deleteWarning} <span className="text-white font-semibold">{deleteTarget.title}</span>. {scriptsCopy.deleteIrreversible}</p>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800">{scriptsCopy.cancel}</button>
                                    <button onClick={deleteScript} className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500">{submitting ? scriptsCopy.deleting : scriptsCopy.delete}</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ProtectedRoute>
    );
}

export default function ScriptsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex flex-col" />}>
            <ScriptsContent />
        </Suspense>
    );
}
