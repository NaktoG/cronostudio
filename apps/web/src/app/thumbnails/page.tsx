'use client';

import { useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import { Image as ImageIcon, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Header from '../components/Header';
import BackToDashboard from '../components/BackToDashboard';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { THUMBNAILS_COPY } from '../content/pages/thumbnails';
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
}

interface Channel {
    id: string;
    name: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: THUMBNAILS_COPY.statuses.pending, color: 'bg-gray-600' },
    designing: { label: THUMBNAILS_COPY.statuses.designing, color: 'bg-yellow-600' },
    designed: { label: THUMBNAILS_COPY.statuses.designed, color: 'bg-blue-600' },
    approved: { label: THUMBNAILS_COPY.statuses.approved, color: 'bg-green-600' },
};

export default function ThumbnailsPage() {
    const { isAuthenticated } = useAuth();
    const authFetch = useAuthFetch();
    const { addToast } = useToast();
    const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', notes: '', imageUrl: '' });
    const [submitting, setSubmitting] = useState(false);
    const [visibleCount, setVisibleCount] = useState(12);
    const modalRef = useRef<HTMLDivElement>(null);

    useDialogFocus(modalRef, showModal);

    const fetchThumbnails = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            if (!isAuthenticated) {
                setThumbnails([]);
                return;
            }
            const query = selectedChannel ? `?channelId=${selectedChannel}` : '';
            const response = await authFetch(`/api/thumbnails${query}`, { signal });
            if (response.ok) setThumbnails(await response.json());
        } catch (err) {
            if (signal?.aborted) return;
            console.error('Error:', err);
            addToast(THUMBNAILS_COPY.toasts.error, 'error');
        } finally {
            if (signal?.aborted) return;
            setLoading(false);
        }
    }, [isAuthenticated, authFetch, addToast, selectedChannel]);

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
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || THUMBNAILS_COPY.errors.create);
            }
            setShowModal(false);
            setFormData({ title: '', notes: '', imageUrl: '' });
            await fetchThumbnails();
            addToast(THUMBNAILS_COPY.toasts.created, 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : THUMBNAILS_COPY.toasts.error, 'error');
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
                throw new Error(data.error || THUMBNAILS_COPY.errors.update);
            }
            await fetchThumbnails();
            addToast(THUMBNAILS_COPY.statusUpdated, 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : THUMBNAILS_COPY.toasts.error, 'error');
        }
    };

    const deleteThumbnail = async (id: string) => {
        if (!confirm(THUMBNAILS_COPY.deleteConfirm)) return;
        try {
            const response = await authFetch(`/api/thumbnails?id=${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || THUMBNAILS_COPY.errors.delete);
            }
            await fetchThumbnails();
            addToast(THUMBNAILS_COPY.toasts.deleted, 'success');
        } catch (err) {
            addToast(err instanceof Error ? err.message : THUMBNAILS_COPY.toasts.error, 'error');
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
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
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">{THUMBNAILS_COPY.title}</h2>
                            </div>
                            <p className="text-sm sm:text-base text-slate-300">{THUMBNAILS_COPY.subtitle}</p>
                        </div>
                        <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row sm:items-center">
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
                            <motion.button
                                onClick={() => setShowModal(true)}
                                className="w-full px-6 py-3 text-sm font-semibold text-black rounded-lg flex items-center justify-center gap-2 sm:w-auto"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(246, 201, 69, 0.95), rgba(246, 201, 69, 0.7))',
                                    boxShadow: '0 10px 20px rgba(246, 201, 69, 0.22)',
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Plus className="w-4 h-4" />
                                {THUMBNAILS_COPY.new}
                            </motion.button>
                        </div>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : thumbnails.length === 0 ? (
                        <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-900/60 border border-gray-800 rounded-full flex items-center justify-center text-yellow-400">
                                <ImageIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{THUMBNAILS_COPY.emptyTitle}</h3>
                            <p className="text-slate-300 mb-6">{THUMBNAILS_COPY.emptySubtitle}</p>
                            <motion.button
                                onClick={() => setShowModal(true)}
                                className="w-full px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 sm:w-auto"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {THUMBNAILS_COPY.create}
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
                                        className="surface-panel glow-hover overflow-hidden transition-all group min-w-0"
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
                                            <span className={`text-xs px-2 py-1 rounded ${STATUS_LABELS[thumb.status]?.color || 'bg-gray-600'} text-white`}>
                                                {STATUS_LABELS[thumb.status]?.label || thumb.status}
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
                                                <option value="pending">{THUMBNAILS_COPY.statuses.pending}</option>
                                                <option value="designing">{THUMBNAILS_COPY.statuses.designing}</option>
                                                <option value="designed">{THUMBNAILS_COPY.statuses.designed}</option>
                                                <option value="approved">{THUMBNAILS_COPY.statuses.approved}</option>
                                            </select>
                                            <button
                                                onClick={() => deleteThumbnail(thumb.id)}
                                                className="text-red-400 hover:text-red-300 text-xs px-2"
                                            >
                                                {THUMBNAILS_COPY.delete}
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
                                        {visibleCount < thumbnails.length ? THUMBNAILS_COPY.list.showMore : THUMBNAILS_COPY.list.showLess}
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
                                <h3 id="thumbnail-modal-title" className="text-2xl font-bold text-white mb-6">{THUMBNAILS_COPY.new}</h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{THUMBNAILS_COPY.form.title}</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            placeholder={THUMBNAILS_COPY.form.placeholderTitle}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{THUMBNAILS_COPY.form.notes}</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 h-24"
                                            placeholder={THUMBNAILS_COPY.form.placeholderNotes}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">{THUMBNAILS_COPY.form.imageUrl}</label>
                                        <input
                                            type="url"
                                            value={formData.imageUrl}
                                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
                                            placeholder={THUMBNAILS_COPY.form.placeholderUrl}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800">
                                            {THUMBNAILS_COPY.cancel}
                                        </button>
                                        <button type="submit" disabled={submitting} className="flex-1 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-50">
                                            {submitting ? THUMBNAILS_COPY.submittingCreate : THUMBNAILS_COPY.create}
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
