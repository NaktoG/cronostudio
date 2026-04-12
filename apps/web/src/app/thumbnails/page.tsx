'use client';

import { Suspense, useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import { Image as ImageIcon, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import BackToDashboard from '../components/BackToDashboard';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLocale } from '../contexts/LocaleContext';
import { getThumbnailsCopy } from '../content/pages/thumbnails';
import { THUMBNAIL_STATUS_BADGES, getThumbnailStatusLabels } from '@/app/content/status/thumbnails';
import useDialogFocus from '../hooks/useDialogFocus';

const useOptimizedImages = Boolean(process.env.NEXT_PUBLIC_IMAGE_HOSTS);

interface Thumbnail {
    id: string;
    title: string;
    notes: string | null;
    image_url: string | null;
    status: string;
    script_title: string | null;
    video_title: string | null;
    created_at: string;
    production_id?: string | null;
    channel_id?: string | null;
}

interface ScriptOption {
    id: string;
    title: string;
}

interface VideoOption {
    id: string;
    title: string;
    youtube_video_id: string;
}

interface Channel {
    id: string;
    name: string;
}

function ThumbnailsContent() {
    const { isAuthenticated } = useAuth();
    const { locale } = useLocale();
    const thumbnailsCopy = getThumbnailsCopy(locale);
    const statusLabels = getThumbnailStatusLabels(locale);
    const authFetch = useAuthFetch();
    const { addToast } = useToast();
    const router = useRouter();
    const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState('');
    const [scriptOptions, setScriptOptions] = useState<ScriptOption[]>([]);
    const [videoOptions, setVideoOptions] = useState<VideoOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', notes: '', imageUrl: '', scriptId: '', videoId: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(12);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const openNewRef = useRef(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();

    useDialogFocus(modalRef, showModal);

    const fetchThumbnails = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            setListError(null);
            if (!isAuthenticated) {
                setThumbnails([]);
                return;
            }
            const query = selectedChannel ? `?channelId=${selectedChannel}` : '';
            const response = await authFetch(`/api/thumbnails${query}`, { signal });
            if (response.ok) {
                const data = await response.json();
                setThumbnails(Array.isArray(data) ? data : []);
                setListError(null);
            } else {
                const data = await response.json().catch(() => null);
                setListError(data?.error || thumbnailsCopy.errors.load);
            }
        } catch (err) {
            if (signal?.aborted) return;
            console.error('[thumbnails] request failed', err);
            addToast(thumbnailsCopy.toasts.error, 'error');
            setListError(err instanceof Error ? err.message : thumbnailsCopy.errors.load);
        } finally {
            if (signal?.aborted) return;
            setLoading(false);
        }
    }, [isAuthenticated, authFetch, addToast, selectedChannel, thumbnailsCopy.errors.load, thumbnailsCopy.toasts.error]);

    useEffect(() => {
        const controller = new AbortController();
        fetchThumbnails(controller.signal);
        return () => controller.abort();
    }, [fetchThumbnails]);

    const fetchChannels = useCallback(async (signal?: AbortSignal) => {
        try {
            if (!isAuthenticated) {
                setChannels([]);
                return;
            }
            const response = await authFetch('/api/channels', { signal });
            if (response.ok) {
                const data = await response.json();
                setChannels(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            if (signal?.aborted) return;
            console.error('[thumbnails] channels fetch failed', err);
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
            setError(null);
            setFormData({ title: '', notes: '', imageUrl: '', scriptId: '', videoId: '' });
            setShowModal(true);
        }
    }, [searchParams]);

    const fetchScriptOptions = useCallback(async (signal?: AbortSignal) => {
        if (!selectedChannel) {
            setScriptOptions([]);
            return;
        }
        try {
            const response = await authFetch(`/api/scripts?channelId=${selectedChannel}`, { signal });
            if (response.ok) {
                const data = await response.json();
                const options = Array.isArray(data)
                    ? data.map((script) => ({ id: script.id, title: script.title }))
                    : [];
                setScriptOptions(options);
            }
        } catch (err) {
            if (signal?.aborted) return;
            console.error('[thumbnails] scripts fetch failed', err);
        }
    }, [authFetch, selectedChannel]);

    const fetchVideoOptions = useCallback(async (signal?: AbortSignal) => {
        if (!selectedChannel) {
            setVideoOptions([]);
            return;
        }
        try {
            const response = await authFetch(`/api/videos?channelId=${selectedChannel}&limit=50`, { signal });
            if (response.ok) {
                const payload = await response.json();
                const rows = Array.isArray(payload?.data) ? payload.data : [];
                setVideoOptions(rows.map((video: { id: string; title: string; youtube_video_id: string }) => ({
                    id: video.id,
                    title: video.title,
                    youtube_video_id: video.youtube_video_id,
                })));
            }
        } catch (err) {
            if (signal?.aborted) return;
            console.error('[thumbnails] videos fetch failed', err);
        }
    }, [authFetch, selectedChannel]);

    useEffect(() => {
        if (!isAuthenticated) return;
        const controller = new AbortController();
        fetchScriptOptions(controller.signal);
        fetchVideoOptions(controller.signal);
        return () => controller.abort();
    }, [isAuthenticated, fetchScriptOptions, fetchVideoOptions]);

    useEffect(() => {
        if (!showModal) return;
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowModal(false);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [showModal]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await authFetch('/api/thumbnails', {
                method: 'POST',
                body: JSON.stringify({
                    title: formData.title,
                    notes: formData.notes,
                    imageUrl: formData.imageUrl,
                    scriptId: formData.scriptId || undefined,
                    videoId: formData.videoId || undefined,
                }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || thumbnailsCopy.errors.create);
            }
            setShowModal(false);
            setFormData({ title: '', notes: '', imageUrl: '', scriptId: '', videoId: '' });
            await fetchThumbnails();
            setError(null);
            addToast(thumbnailsCopy.toasts.created, 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : thumbnailsCopy.toasts.error, 'error');
            setError(err instanceof Error ? err.message : thumbnailsCopy.toasts.error);
        } finally {
            setSubmitting(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const response = await authFetch(`/api/thumbnails?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || thumbnailsCopy.errors.update);
            }
            await fetchThumbnails();
            addToast(thumbnailsCopy.statusUpdated, 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : thumbnailsCopy.toasts.error, 'error');
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
            await Promise.all(selectedIds.map((id) => updateStatus(id, status)));
            clearSelection();
        } catch {
            addToast(thumbnailsCopy.toasts.error, 'error');
        }
    };

    const deleteThumbnail = async (id: string) => {
        if (!confirm(thumbnailsCopy.deleteConfirm)) return;
        try {
            const response = await authFetch(`/api/thumbnails?id=${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || thumbnailsCopy.errors.delete);
            }
            await fetchThumbnails();
            addToast(thumbnailsCopy.toasts.deleted, 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : thumbnailsCopy.toasts.error, 'error');
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
                    <h1 className="sr-only">{thumbnailsCopy.title}</h1>
                    <motion.div
                        className="flex flex-col gap-4 mb-6 sm:mb-8 sm:flex-row sm:items-center sm:justify-between"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div>
                            <BackToDashboard />
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-10 h-10 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                                    <ImageIcon className="w-5 h-5" />
                                </span>
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">{thumbnailsCopy.title}</h2>
                            </div>
                            <p className="text-sm sm:text-base text-slate-300">{thumbnailsCopy.subtitle}</p>
                        </div>
                        <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row sm:flex-wrap sm:items-end">
                            {channels.length > 0 && (
                                <div className="min-w-[220px]">
                                    <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">{thumbnailsCopy.controls.channel}</label>
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
                                        <option value="">{thumbnailsCopy.controls.allChannels}</option>
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
                                    <span className="text-xs text-slate-400">{selectedIds.length} {thumbnailsCopy.controls.selectedCount}</span>
                                    <button
                                        type="button"
                                        onClick={() => updateSelectedStatus('approved')}
                                        className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                                    >
                                        {thumbnailsCopy.controls.approve}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateSelectedStatus('designing')}
                                        className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                                    >
                                        {thumbnailsCopy.controls.designing}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearSelection}
                                        className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                                    >
                                        {thumbnailsCopy.controls.clear}
                                    </button>
                                </div>
                            )}
                            <motion.button
                                onClick={() => {
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
                                {thumbnailsCopy.new}
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
                                    onClick={() => fetchThumbnails()}
                                    className="text-xs font-semibold text-yellow-300 hover:text-yellow-200"
                                >
                                    {thumbnailsCopy.controls.retry}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : thumbnails.length === 0 ? (
                        <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-900/60 border border-gray-800 rounded-full flex items-center justify-center text-yellow-400">
                                <ImageIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{thumbnailsCopy.emptyTitle}</h3>
                            <p className="text-slate-300 mb-6">{thumbnailsCopy.emptySubtitle}</p>
                            <motion.button
                                onClick={() => {
                                    setError(null);
                                    setShowModal(true);
                                }}
                                className="w-full px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 sm:w-auto"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {thumbnailsCopy.create}
                            </motion.button>
                        </motion.div>
                    ) : (
                        <div className="space-y-4">
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {thumbnails.slice(0, visibleCount).map((thumb) => (
                                    <motion.div
                                        key={thumb.id}
                                        className={`surface-panel glow-hover overflow-hidden transition-all group min-w-0 ${selectedIds.includes(thumb.id) ? 'ring-2 ring-yellow-400/60' : ''}`}
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
                                                unoptimized={!useOptimizedImages}
                                            />
                                        ) : (
                                            <ImageIcon className="w-12 h-12 text-slate-500" />
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(thumb.id)}
                                                    onChange={() => toggleSelection(thumb.id)}
                                                    aria-label={`${thumbnailsCopy.controls.selectPrefix} ${thumb.title}`}
                                                    className="h-4 w-4 rounded border-gray-700 text-yellow-400 focus:ring-yellow-400"
                                                />
                                                {thumbnailsCopy.controls.select}
                                            </label>
                                            <span className={`text-xs px-2 py-1 rounded ${THUMBNAIL_STATUS_BADGES[thumb.status as keyof typeof THUMBNAIL_STATUS_BADGES] || 'bg-gray-600'} text-white`}>
                                                {statusLabels[thumb.status as keyof typeof statusLabels] || thumb.status}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-yellow-400 transition-colors break-words">
                                            {thumb.title}
                                        </h3>
                                        {thumb.notes && (
                                            <p className="text-gray-400 text-sm line-clamp-2">{thumb.notes}</p>
                                        )}
                                        <div className="mt-4 pt-3 border-t border-gray-800 flex flex-col gap-2 sm:flex-row sm:items-center">
                                            <select
                                                value={thumb.status}
                                                onChange={(e) => updateStatus(thumb.id, e.target.value)}
                                                className="w-full text-xs bg-gray-800 border border-gray-700 rounded px-2 py-2 text-white sm:flex-1"
                                            >
                                                <option value="pending">{thumbnailsCopy.statuses.pending}</option>
                                                <option value="designing">{thumbnailsCopy.statuses.designing}</option>
                                                <option value="designed">{thumbnailsCopy.statuses.designed}</option>
                                                <option value="approved">{thumbnailsCopy.statuses.approved}</option>
                                            </select>
                                            {thumb.production_id && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const productionId = thumb.production_id;
                                                        if (!productionId) return;
                                                        const params = new URLSearchParams({ productionId });
                                                        if (thumb.channel_id) {
                                                            params.set('channelId', thumb.channel_id);
                                                        }
                                                        router.push(`/?${params.toString()}`);
                                                    }}
                                                    className="text-xs text-yellow-300 hover:text-yellow-200 px-2"
                                                >
                                                    {thumbnailsCopy.controls.viewProduction}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteThumbnail(thumb.id)}
                                                className="text-red-400 hover:text-red-300 text-xs px-2"
                                            >
                                                {thumbnailsCopy.delete}
                                            </button>
                                        </div>
                                    </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                            {thumbnails.length > 12 && (
                                <div className="pt-4 flex justify-center">
                                    <button
                                        onClick={() => setVisibleCount(visibleCount < thumbnails.length ? thumbnails.length : 12)}
                                        className="text-xs px-4 py-2 rounded-full border border-gray-700 text-slate-300 hover:text-white"
                                    >
                                        {visibleCount < thumbnails.length ? thumbnailsCopy.list.showMore : thumbnailsCopy.list.showLess}
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
                                aria-labelledby="thumbnail-modal-title"
                                className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-6 sm:p-8 w-full max-w-md max-h-[85vh] overflow-y-auto"
                                ref={modalRef}
                                tabIndex={-1}
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.9 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 id="thumbnail-modal-title" className="text-2xl font-bold text-white mb-6">{thumbnailsCopy.new}</h3>
                                {error && (
                                    <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                        {error}
                                    </div>
                                )}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <datalist id="script-options">
                                        {scriptOptions.map((script) => (
                                            <option key={script.id} value={script.id}>{script.title}</option>
                                        ))}
                                    </datalist>
                                    <datalist id="video-options">
                                        {videoOptions.map((video) => (
                                            <option key={video.id} value={video.id}>{video.title || video.youtube_video_id}</option>
                                        ))}
                                    </datalist>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{thumbnailsCopy.modal.scriptIdOptional}</label>
                                        <input
                                            type="text"
                                            value={formData.scriptId}
                                            onChange={(e) => setFormData({ ...formData, scriptId: e.target.value })}
                                            list="script-options"
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            placeholder={thumbnailsCopy.modal.scriptIdPlaceholder}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{thumbnailsCopy.modal.videoIdOptional}</label>
                                        <input
                                            type="text"
                                            value={formData.videoId}
                                            onChange={(e) => setFormData({ ...formData, videoId: e.target.value })}
                                            list="video-options"
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            placeholder={thumbnailsCopy.modal.videoIdPlaceholder}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{thumbnailsCopy.form.title}</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            placeholder={thumbnailsCopy.form.placeholderTitle}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{thumbnailsCopy.form.notes}</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-24"
                                            placeholder={thumbnailsCopy.form.placeholderNotes}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{thumbnailsCopy.form.imageUrl}</label>
                                        <input
                                            type="url"
                                            value={formData.imageUrl}
                                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            placeholder={thumbnailsCopy.form.placeholderUrl}
                                        />
                                        <p className="mt-1 text-xs text-slate-400">{thumbnailsCopy.modal.imageUrlHelper}</p>
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
                                            {thumbnailsCopy.cancel}
                                        </button>
                                        <button type="submit" disabled={submitting} className="flex-1 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-50">
                                            {submitting ? thumbnailsCopy.submittingCreate : thumbnailsCopy.create}
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

export default function ThumbnailsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex flex-col" />}>
            <ThumbnailsContent />
        </Suspense>
    );
}
