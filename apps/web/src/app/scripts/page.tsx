'use client';

import { useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import { FileText, Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import BackToDashboard from '../components/BackToDashboard';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { SCRIPTS_COPY } from '../content/pages/scripts';
import useDialogFocus from '../hooks/useDialogFocus';
import Link from 'next/link';

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
    idea_id?: string | null;
    idea_title: string | null;
    created_at: string;
}

interface Channel {
    id: string;
    name: string;
}

interface IdeaOption {
    id: string;
    title: string;
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
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState('');
    const [ideaOptions, setIdeaOptions] = useState<IdeaOption[]>([]);
    const [ideaTitleInput, setIdeaTitleInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ title: '', intro: '', body: '', cta: '', outro: '', ideaId: '' });
    const [deleteTarget, setDeleteTarget] = useState<Script | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [visibleCount, setVisibleCount] = useState(12);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [pipelineLoading, setPipelineLoading] = useState<string[]>([]);
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
            const query = selectedChannel ? `?channelId=${selectedChannel}` : '';
            const response = await authFetch(`/api/scripts${query}`, { signal });
            if (response.ok) setScripts(await response.json());
        } catch (err) {
            if (signal?.aborted) return;
            console.error('Error:', err);
            addToast(SCRIPTS_COPY.toasts.error, 'error');
        } finally {
            if (signal?.aborted) return;
            setLoading(false);
        }
    }, [isAuthenticated, authFetch, addToast, selectedChannel]);

    useEffect(() => {
        const controller = new AbortController();
        fetchScripts(controller.signal);
        return () => controller.abort();
    }, [fetchScripts]);

    const fetchChannels = useCallback(async (signal?: AbortSignal) => {
        try {
            if (!isAuthenticated) {
                setChannels([]);
                return;
            }
            const response = await authFetch('/api/channels', { signal });
            if (response.ok) {
                setChannels(await response.json());
            }
        } catch (err) {
            if (signal?.aborted) return;
            console.error('Error fetching channels:', err);
        }
    }, [isAuthenticated, authFetch]);

    useEffect(() => {
        if (!isAuthenticated) return;
        const controller = new AbortController();
        fetchChannels(controller.signal);
        return () => controller.abort();
    }, [isAuthenticated, fetchChannels]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const storedChannel = window.localStorage.getItem('cronostudio.channelId') || '';
        if (storedChannel && storedChannel !== selectedChannel) {
            setSelectedChannel(storedChannel);
        }
    }, [selectedChannel]);

    const fetchIdeaOptions = useCallback(async (signal?: AbortSignal) => {
        if (!selectedChannel) {
            setIdeaOptions([]);
            return;
        }
        try {
            const response = await authFetch(`/api/ideas?channelId=${selectedChannel}`, { signal });
            if (response.ok) {
                const data = await response.json();
                const options = Array.isArray(data)
                    ? data.map((idea) => ({ id: idea.id, title: idea.title }))
                    : [];
                setIdeaOptions(options);
            }
        } catch (err) {
            if (signal?.aborted) return;
            console.error('Error fetching ideas:', err);
        }
    }, [authFetch, selectedChannel]);

    useEffect(() => {
        if (!isAuthenticated) return;
        const controller = new AbortController();
        fetchIdeaOptions(controller.signal);
        return () => controller.abort();
    }, [isAuthenticated, fetchIdeaOptions]);

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
            setFormData({ title: '', intro: '', body: '', cta: '', outro: '', ideaId: '' });
            setIdeaTitleInput('');
            await fetchScripts();
            addToast(editingId ? SCRIPTS_COPY.toasts.updated : SCRIPTS_COPY.toasts.created, 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : SCRIPTS_COPY.toasts.error, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds((current) => current.includes(id)
            ? current.filter((item) => item !== id)
            : [...current, id]
        );
    };

    const clearSelection = () => setSelectedIds([]);

    const updateSelectedStatus = async (status: string) => {
        if (selectedIds.length === 0) return;
        try {
            await Promise.all(selectedIds.map((id) => authFetch(`/api/scripts?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            })));
            clearSelection();
            await fetchScripts();
            addToast(SCRIPTS_COPY.toasts.updated, 'success');
        } catch (err) {
            addToast(SCRIPTS_COPY.toasts.error, 'error');
        }
    };

    const openEdit = (script: Script) => {
        const ideaTitle = script.idea_id
            ? ideaOptions.find((idea) => idea.id === script.idea_id)?.title ?? ''
            : '';
        setIdeaTitleInput(ideaTitle);
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

    const runPublishPipeline = async (script: Script) => {
        const channelId = selectedChannel;
        if (!channelId) {
            addToast('Selecciona un canal para ejecutar el pipeline', 'error');
            return;
        }
        if (pipelineLoading.includes(script.id)) return;
        setPipelineLoading((current) => [...current, script.id]);
        try {
            const seoResponse = await authFetch('/api/ai/runs/execute', {
                method: 'POST',
                body: JSON.stringify({
                    profileKey: 'titles_thumbs',
                    channelId,
                    input: { ideaId: script.idea_id, scriptId: script.id },
                }),
            });
            if (!seoResponse.ok) {
                const data = await seoResponse.json();
                throw new Error(data.error || 'Error al generar SEO');
            }

            const thumbResponse = await authFetch('/api/thumbnails', {
                method: 'POST',
                body: JSON.stringify({
                    title: script.title,
                    scriptId: script.id,
                    notes: 'Generado desde pipeline',
                }),
            });
            if (!thumbResponse.ok) {
                const data = await thumbResponse.json();
                throw new Error(data.error || 'Error al crear miniatura');
            }

            await fetchScripts();
            addToast('Pipeline completado (SEO + miniatura)', 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : SCRIPTS_COPY.toasts.error, 'error');
        } finally {
            setPipelineLoading((current) => current.filter((id) => id !== script.id));
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
                    <h1 className="sr-only">{SCRIPTS_COPY.title}</h1>
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
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">{SCRIPTS_COPY.title}</h2>
                                </div>
                                <p className="text-sm sm:text-base text-slate-300">{SCRIPTS_COPY.subtitle}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row sm:items-end">
                            {channels.length > 0 && (
                                <div className="min-w-[220px]">
                                    <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Canal</label>
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
                                        <option value="">Todos los canales</option>
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
                                    <span className="text-xs text-slate-400">{selectedIds.length} seleccionados</span>
                                    <button
                                        type="button"
                                        onClick={() => updateSelectedStatus('review')}
                                        className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                                    >
                                        A revisión
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateSelectedStatus('approved')}
                                        className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                                    >
                                        Aprobar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateSelectedStatus('recorded')}
                                        className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                                    >
                                        Grabado
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearSelection}
                                        className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                                    >
                                        Limpiar
                                    </button>
                                </div>
                            )}
                            <motion.button
                                onClick={() => { setEditingId(null); setFormData({ title: '', intro: '', body: '', cta: '', outro: '', ideaId: '' }); setShowModal(true); }}
                                className="w-full px-6 py-3 text-sm font-semibold text-black rounded-lg flex items-center justify-center gap-2 sm:w-auto sm:self-end"
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
                        </div>
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
                                onClick={() => { setEditingId(null); setFormData({ title: '', intro: '', body: '', cta: '', outro: '', ideaId: '' }); setShowModal(true); }}
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
                                                        aria-label={`Seleccionar guion ${script.title}`}
                                                        className="h-4 w-4 rounded border-gray-700 text-yellow-400 focus:ring-yellow-400"
                                                    />
                                                    Seleccionar
                                                </label>
                                                <span className={`text-xs px-2 py-1 rounded ${STATUS_LABELS[script.status]?.color || 'bg-gray-600'} text-white`}>
                                                    {STATUS_LABELS[script.status]?.label || script.status}
                                                </span>
                                                <span className="text-xs text-gray-500">{script.word_count} {SCRIPTS_COPY.wordCountLabel}</span>
                                                <span className="text-xs text-yellow-400">⏱ ~{formatDuration(script.estimated_duration_seconds)}</span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-white break-words">{script.title}</h3>
                                            {script.idea_title && (
                                                <p className="text-sm text-gray-500 mt-1">{SCRIPTS_COPY.ideaPrefix} {script.idea_title}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => runPublishPipeline(script)}
                                                disabled={pipelineLoading.includes(script.id)}
                                                className="text-sky-300 hover:text-sky-200 text-xs px-2 disabled:opacity-60"
                                            >
                                                {pipelineLoading.includes(script.id) ? 'Pipeline...' : 'Pipeline Publicar'}
                                            </button>
                                            <Link
                                                href={`/ai?profile=retention_editor&scriptId=${script.id}${selectedChannel ? `&channelId=${selectedChannel}` : ''}`}
                                                className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 text-xs px-2"
                                            >
                                                <Sparkles className="w-3 h-3" />
                                                Retención
                                            </Link>
                                            <Link
                                                href={`/ai?profile=titles_thumbs&scriptId=${script.id}${script.idea_id ? `&ideaId=${script.idea_id}` : ''}${selectedChannel ? `&channelId=${selectedChannel}` : ''}`}
                                                className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200 text-xs px-2"
                                            >
                                                <Sparkles className="w-3 h-3" />
                                                SEO + Títulos
                                            </Link>
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
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Idea ID (opcional)</label>
                                        <input
                                            type="text"
                                            value={formData.ideaId}
                                            onChange={(e) => setFormData({ ...formData, ideaId: e.target.value })}
                                            list="idea-options"
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            placeholder="UUID de la idea"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Idea (por título)</label>
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
                                            placeholder="Buscar por título"
                                        />
                                    </div>
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
                                    <button onClick={deleteScript} className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500">{submitting ? SCRIPTS_COPY.deleting : SCRIPTS_COPY.delete}</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ProtectedRoute>
    );
}
