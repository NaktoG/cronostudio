'use client';

import { useState, useEffect, useCallback, FormEvent, useRef, useMemo } from 'react';
import { Lightbulb, Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import BackToDashboard from '../components/BackToDashboard';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { IDEAS_COPY } from '../content/pages/ideas';
import { IDEA_STATUS_LABELS, IdeaStatus } from '../content/labels';
import useDialogFocus from '../hooks/useDialogFocus';
import { evaluateIdeaReady } from '@/lib/ideaReady';
import Link from 'next/link';

interface Idea {
    id: string;
    title: string;
    description: string | null;
    channelId: string | null;
    status: 'draft' | 'approved' | 'in_production' | 'completed' | 'archived';
    priority: number;
    tags: string[];
    channel_name: string | null;
    created_at: string;
}

interface Channel {
    id: string;
    name: string;
}

const STATUS_LABELS: Record<IdeaStatus, { label: string; color: string }> = {
    draft: { label: IDEA_STATUS_LABELS.draft, color: 'bg-gray-600' },
    approved: { label: IDEA_STATUS_LABELS.approved, color: 'bg-green-600' },
    in_production: { label: IDEA_STATUS_LABELS.in_production, color: 'bg-yellow-600' },
    completed: { label: IDEA_STATUS_LABELS.completed, color: 'bg-blue-600' },
    archived: { label: IDEA_STATUS_LABELS.archived, color: 'bg-gray-800' },
};

export default function IdeasPage() {
    const { isAuthenticated } = useAuth();
    const authFetch = useAuthFetch();
    const { addToast } = useToast();
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState('');
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);
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
    const [statusErrors, setStatusErrors] = useState<Record<string, string[]>>({});
    const [deleteTarget, setDeleteTarget] = useState<Idea | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);
    const [visibleCount, setVisibleCount] = useState(12);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [pipelineLoading, setPipelineLoading] = useState<string[]>([]);
    const tagSuggestions = useMemo(() => {
        const map = new Map<string, number>();
        ideas.forEach((idea) => {
            if (selectedChannel && idea.channelId !== selectedChannel) return;
            idea.tags?.forEach((tag) => {
                const key = tag.trim().toLowerCase();
                if (!key) return;
                map.set(key, (map.get(key) ?? 0) + 1);
            });
        });
        return Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([tag]) => tag);
    }, [ideas, selectedChannel]);
    const openNewRef = useRef(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const deleteRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();

    useDialogFocus(modalRef, showModal);
    useDialogFocus(deleteRef, Boolean(deleteTarget));

    const fetchIdeas = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            setListError(null);
            if (!isAuthenticated) {
                setIdeas([]);
                return;
            }
            const query = selectedChannel ? `?channelId=${selectedChannel}` : '';
            const response = await authFetch(`/api/ideas${query}`, { signal });
            if (response.ok) {
                setIdeas(await response.json());
                setListError(null);
            } else {
                const data = await response.json().catch(() => null);
                setListError(data?.error || IDEAS_COPY.toasts.error);
            }
        } catch (err) {
            if (signal?.aborted) return;
            console.error('Error:', err);
            addToast(IDEAS_COPY.toasts.error, 'error');
            setListError(err instanceof Error ? err.message : IDEAS_COPY.toasts.error);
        } finally {
            if (signal?.aborted) return;
            setLoading(false);
        }
    }, [isAuthenticated, authFetch, addToast, selectedChannel]);

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        fetchIdeas(controller.signal);
        return () => controller.abort();
    }, [isAuthenticated, fetchIdeas]);

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

    useEffect(() => {
        if (openNewRef.current) return;
        if (searchParams?.get('new') === '1') {
            openNewRef.current = true;
            setEditingIdea(null);
            setError(null);
            setFormData({ title: '', description: '', priority: 0, channelId: '', tagsInput: '' });
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

    const normalizeTags = (input: string) =>
        input
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const targetUrl = editingIdea ? `/api/ideas?id=${editingIdea.id}` : '/api/ideas';
            const method = editingIdea ? 'PUT' : 'POST';
            const payload = {
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                tags: normalizeTags(formData.tagsInput),
                ...(formData.channelId ? { channelId: formData.channelId } : {}),
            };
            const response = await authFetch(targetUrl, {
                method,
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || (editingIdea ? 'Error al actualizar idea' : 'Error al crear idea'));
            }
            setShowModal(false);
            setEditingIdea(null);
            setFormData({ title: '', description: '', priority: 0, channelId: '', tagsInput: '' });
            await fetchIdeas();
            addToast(editingIdea ? IDEAS_COPY.toasts.updated : IDEAS_COPY.toasts.created, 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : IDEAS_COPY.toasts.error, 'error');
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setSubmitting(false);
        }
    };

    const readinessPreview = evaluateIdeaReady(formData.title, formData.description);
    const ideaTemplate = 'Promesa: En este video vas a entender ...\nBullets:\n- Punto 1\n- Punto 2\n- Punto 3\nHook: Escribe 2 frases o 200 caracteres...';
    const applyTemplate = () => {
        setFormData((prev) => {
            const base = prev.description?.trim();
            if (!base) {
                return { ...prev, description: ideaTemplate };
            }
            if (base.includes('Promesa:') || base.includes('Bullets:') || base.includes('Hook:')) {
                return prev;
            }
            return { ...prev, description: `${base}\n\n${ideaTemplate}` };
        });
    };

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

    const updateStatus = async (id: string, status: string) => {
        try {
            if (status === 'approved') {
                const targetIdea = ideas.find((idea) => idea.id === id);
                if (targetIdea) {
                    const readiness = evaluateIdeaReady(targetIdea.title, targetIdea.description);
                    if (!readiness.isReady) {
                        addToast(IDEAS_COPY.toasts.ideaNotReady, 'error');
                        setStatusErrors((prev) => ({ ...prev, [id]: readiness.errors }));
                        return;
                    }
                }
            }
            const response = await authFetch(`/api/ideas?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al actualizar estado');
            }
            setStatusErrors((prev) => {
                if (!prev[id]) return prev;
                const { [id]: _, ...rest } = prev;
                return rest;
            });
            await fetchIdeas();
            addToast(IDEAS_COPY.toasts.statusUpdated, 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : IDEAS_COPY.toasts.error, 'error');
            setError(err instanceof Error ? err.message : 'Error');
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds((current) => current.includes(id)
            ? current.filter((item) => item !== id)
            : [...current, id]
        );
    };

    const clearSelection = () => setSelectedIds([]);

    const updateSelectedStatus = async (status: IdeaStatus) => {
        if (selectedIds.length === 0) return;
        try {
            if (status === 'approved') {
                const nextErrors: Record<string, string[]> = {};
                const readyIds: string[] = [];

                selectedIds.forEach((id) => {
                    const targetIdea = ideas.find((idea) => idea.id === id);
                    if (!targetIdea) return;
                    const readiness = evaluateIdeaReady(targetIdea.title, targetIdea.description);
                    if (!readiness.isReady) {
                        nextErrors[id] = readiness.errors;
                    } else {
                        readyIds.push(id);
                    }
                });

                if (Object.keys(nextErrors).length > 0) {
                    setStatusErrors((prev) => ({ ...prev, ...nextErrors }));
                    addToast(IDEAS_COPY.toasts.ideaNotReady, 'error');
                }

                if (readyIds.length === 0) return;
                await Promise.all(readyIds.map((id) => updateStatus(id, status)));
                clearSelection();
                return;
            }

            await Promise.all(selectedIds.map((id) => updateStatus(id, status)));
            clearSelection();
        } catch (err) {
            addToast(IDEAS_COPY.toasts.error, 'error');
        }
    };

    const deleteIdea = async (id: string) => {
        const target = ideas.find((idea) => idea.id === id) || null;
        setDeleteTarget(target);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteSubmitting(true);
        try {
            const response = await authFetch(`/api/ideas?id=${deleteTarget.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al eliminar idea');
            }
            setDeleteTarget(null);
            await fetchIdeas();
            addToast(IDEAS_COPY.toasts.deleted, 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : IDEAS_COPY.toasts.error, 'error');
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setDeleteSubmitting(false);
        }
    };

    const runPipeline = async (idea: Idea) => {
        const channelId = idea.channelId ?? selectedChannel;
        if (!channelId) {
            addToast('Selecciona un canal para ejecutar el pipeline', 'error');
            return;
        }
        if (pipelineLoading.includes(idea.id)) return;
        setPipelineLoading((current) => [...current, idea.id]);
        try {
            const scriptResponse = await authFetch('/api/ai/runs/execute', {
                method: 'POST',
                body: JSON.stringify({
                    profileKey: 'script_architect',
                    channelId,
                    input: { ideaId: idea.id },
                }),
            });
            if (!scriptResponse.ok) {
                const data = await scriptResponse.json();
                throw new Error(data.error || 'Error al generar guion');
            }
            const scriptData = await scriptResponse.json();
            const scriptId = scriptData?.applied?.scriptId as string | undefined;
            if (!scriptId) {
                throw new Error('Guion no generado');
            }

            const seoResponse = await authFetch('/api/ai/runs/execute', {
                method: 'POST',
                body: JSON.stringify({
                    profileKey: 'titles_thumbs',
                    channelId,
                    input: { ideaId: idea.id, scriptId },
                }),
            });
            if (!seoResponse.ok) {
                const data = await seoResponse.json();
                throw new Error(data.error || 'Error al generar SEO');
            }

            await fetchIdeas();
            addToast('Pipeline completado (guion + SEO)', 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : 'Error al ejecutar pipeline', 'error');
        } finally {
            setPipelineLoading((current) => current.filter((id) => id !== idea.id));
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
                    <h1 className="sr-only">{IDEAS_COPY.title}</h1>
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
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">{IDEAS_COPY.title}</h2>
                            </div>
                            <p className="text-sm sm:text-base text-slate-300">{IDEAS_COPY.subtitle}</p>
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
                                    <span className="text-xs text-slate-400">{selectedIds.length} seleccionadas</span>
                                    <button
                                        type="button"
                                        onClick={() => updateSelectedStatus('approved')}
                                        className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                                    >
                                        Aprobar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateSelectedStatus('archived')}
                                        className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                                    >
                                        Archivar
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
                                {IDEAS_COPY.new}
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
                                    onClick={() => fetchIdeas()}
                                    className="text-xs font-semibold text-yellow-300 hover:text-yellow-200"
                                >
                                    Reintentar
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
                            <h3 className="text-xl font-semibold text-white mb-2">{IDEAS_COPY.emptyTitle}</h3>
                            <p className="text-slate-300 mb-6">{IDEAS_COPY.emptySubtitle}</p>
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
                                {IDEAS_COPY.create}
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
                                                aria-label={`Seleccionar idea ${idea.title}`}
                                                className="h-4 w-4 rounded border-gray-700 text-yellow-400 focus:ring-yellow-400"
                                            />
                                            Seleccionar
                                        </label>
                                        <span className={`text-xs px-2 py-1 rounded ${STATUS_LABELS[idea.status]?.color || 'bg-gray-600'} text-white`}>
                                            {STATUS_LABELS[idea.status]?.label || idea.status}
                                        </span>
                                        <span className="text-xs text-yellow-400">★ {idea.priority}</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors break-words">
                                        {idea.title}
                                    </h3>
                                    {idea.description && (
                                        <p className="text-gray-400 text-sm mb-3 line-clamp-3 sm:line-clamp-2">{idea.description}</p>
                                    )}
                                    {idea.channel_name && (
                                        <p className="text-xs text-slate-400">{IDEAS_COPY.channelPrefix} {idea.channel_name}</p>
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
                                            onChange={(e) => updateStatus(idea.id, e.target.value)}
                                            className="w-full text-xs bg-gray-800 border border-gray-700 rounded px-2 py-2 text-white sm:flex-1"
                                        >
                                        <option value="draft">{IDEA_STATUS_LABELS.draft}</option>
                                        <option value="approved">{IDEA_STATUS_LABELS.approved}</option>
                                        <option value="in_production">{IDEA_STATUS_LABELS.in_production}</option>
                                        <option value="completed">{IDEA_STATUS_LABELS.completed}</option>
                                        <option value="archived">{IDEA_STATUS_LABELS.archived}</option>
                                        </select>
                                        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                                            <button
                                                type="button"
                                                onClick={() => runPipeline(idea)}
                                                disabled={pipelineLoading.includes(idea.id)}
                                                className="text-sky-300 hover:text-sky-200 text-xs px-2 disabled:opacity-60"
                                            >
                                                {pipelineLoading.includes(idea.id) ? 'Pipeline...' : 'Pipeline AI'}
                                            </button>
                                            <Link
                                                href={`/ai?profile=script_architect&ideaId=${idea.id}${idea.channelId ? `&channelId=${idea.channelId}` : selectedChannel ? `&channelId=${selectedChannel}` : ''}`}
                                                className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 text-xs px-2"
                                            >
                                                <Sparkles className="w-3 h-3" />
                                                Guion AI
                                            </Link>
                                            <button
                                                onClick={() => startEdit(idea)}
                                                className="text-yellow-300 hover:text-yellow-200 text-xs px-2"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => deleteIdea(idea.id)}
                                                className="text-red-400 hover:text-red-300 text-xs px-2"
                                            >
                                                {IDEAS_COPY.delete}
                                            </button>
                                        </div>
                                    </div>
                                    {statusErrors[idea.id]?.length > 0 && (
                                        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                                            <div className="font-semibold mb-1">{IDEAS_COPY.errors.ideaNotReadyTitle}</div>
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
                                                Completar idea
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
                                        {visibleCount < ideas.length ? IDEAS_COPY.list.showMore : IDEAS_COPY.list.showLess}
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
                                    {editingIdea ? IDEAS_COPY.edit : IDEAS_COPY.new}
                                </h3>
                                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{IDEAS_COPY.form.title}</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            placeholder={IDEAS_COPY.form.placeholderTitle}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{IDEAS_COPY.form.description}</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-24"
                                            placeholder={IDEAS_COPY.form.placeholderDescription}
                                        />
                                        <div className="mt-3 rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2 text-xs text-slate-300">
                                            <div className="font-semibold text-slate-200">Checklist para aprobar</div>
                                            <ul className="mt-2 space-y-1">
                                                <li className={readinessPreview.errors.includes('Falta promesa') ? 'text-red-300' : 'text-emerald-300'}>
                                                    Promesa: “En este video vas a entender…”
                                                </li>
                                                <li className={readinessPreview.errors.includes('Faltan bullets (min 3)') ? 'text-red-300' : 'text-emerald-300'}>
                                                    Bullets: minimo 3 lineas con “-”
                                                </li>
                                                <li className={readinessPreview.errors.includes('Falta hook (min 2 frases o 200 chars)') ? 'text-red-300' : 'text-emerald-300'}>
                                                    Hook: 2 frases o 200 caracteres
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{IDEAS_COPY.form.channel}</label>
                                        <select
                                            value={formData.channelId}
                                            onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                        >
                                            <option value="">{IDEAS_COPY.form.noChannel}</option>
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
                                                Usar canal seleccionado
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{IDEAS_COPY.form.priority}</label>
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
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{IDEAS_COPY.form.tags}</label>
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
                                            placeholder={IDEAS_COPY.form.placeholderTags}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800">
                                            {IDEAS_COPY.cancel}
                                        </button>
                                        <button type="submit" disabled={submitting} className="flex-1 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-50">
                                            {submitting ? (editingIdea ? IDEAS_COPY.saving : IDEAS_COPY.creating) : editingIdea ? IDEAS_COPY.save : IDEAS_COPY.new}
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
                                <h3 id="idea-delete-title" className="text-xl font-bold text-white mb-2">{IDEAS_COPY.deleteTitle}</h3>
                                <p className="text-gray-400 text-sm mb-6">
                                    {IDEAS_COPY.deleteConfirm} <span className="text-white font-semibold">{deleteTarget.title}</span>?
                                    {IDEAS_COPY.deleteIrreversible}
                                </p>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTarget(null)}
                                        className="flex-1 py-2.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800"
                                    >
                                        {IDEAS_COPY.cancel}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmDelete}
                                        disabled={deleteSubmitting}
                                        className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-400 disabled:opacity-60"
                                    >
                                        {deleteSubmitting ? IDEAS_COPY.deleting : IDEAS_COPY.delete}
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
