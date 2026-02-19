'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Linkedin, Music2, Plus, Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { PageTransition } from './components/Animations';
import PriorityActions from './components/PriorityActions';
import ProductionPipeline from './components/ProductionPipeline';
import ProductionsList from './components/ProductionsList';
import AutomationRuns from './components/AutomationRuns';
import { useAuth, useAuthFetch } from './contexts/AuthContext';
import type { Production } from '@/domain/types';
import { UI_COPY } from '@/config/uiCopy';
import { useDashboardData } from '@/hooks/useDashboardData';
import { productionsService } from '@/services/productionsService';
import { buildPendingActions } from '@/domain/mappers/pendingActions';
import { usePipelineFilter } from '@/hooks/usePipelineFilter';
import type { PendingActionItem } from '@/domain/types/actions';
import { PIPELINE_STAGE_CONFIG_BY_ID } from '@/domain/configs/pipeline';

const filterProductionsByStage = (productions: Production[], stage: Production['status'] | null): Production[] => {
  if (!stage) return productions;
  return productions.filter((production) => production.status === stage);
};

function DashboardContent() {
  const { isAuthenticated } = useAuth();
  const authFetch = useAuthFetch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, loading, fetchData } = useDashboardData(authFetch, isAuthenticated);
  const { activeStage, setStageFilter, clearStageFilter } = usePipelineFilter();
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const openCreateContent = useCallback(() => {
    setCreateError(null);
    setShowModal(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchData();
    else {
      // handled by hook
    }
  }, [isAuthenticated, fetchData]);

  useEffect(() => {
    if (searchParams?.get('new') === '1') {
      openCreateContent();
    }
  }, [openCreateContent, searchParams]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      await productionsService.create(authFetch, newTitle.trim());
      setNewTitle('');
      setShowModal(false);
      fetchData();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : UI_COPY.errors.fallbackDescription);
    } finally {
      setIsCreating(false);
    }
  };

  const priorityActions = useMemo<PendingActionItem[]>(() => buildPendingActions(data.productions), [data.productions]);
  const activeProductions = useMemo(() => data.productions.filter(p => p.status !== 'published'), [data.productions]);
  const filteredProductions = useMemo(
    () => filterProductionsByStage(activeProductions, activeStage),
    [activeProductions, activeStage]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <PageTransition className="flex-1">
        <main className="w-full px-4 md:px-8 lg:px-12 py-8">
            {/* Header */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-yellow-400/90 mb-3">
                    <Sparkles className="w-4 h-4" />
                    {UI_COPY.dashboard.kicker}
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-3">
                    {UI_COPY.dashboard.title}
                  </h1>
                  <p className="text-base md:text-lg text-slate-300 max-w-2xl">
                    {UI_COPY.dashboard.description}
                  </p>
                </div>
                <motion.button
                  onClick={openCreateContent}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-black rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(246, 201, 69, 0.95), rgba(246, 201, 69, 0.7))',
                    boxShadow: '0 10px 20px rgba(246, 201, 69, 0.22)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-4 h-4" />
                  {UI_COPY.dashboard.createLabel}
                </motion.button>
              </div>
            </motion.div>

            {loading ? (
              <div className="flex justify-center py-20">
                <motion.div
                  className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Pipeline */}
                <ProductionPipeline
                  stats={data.pipelineStats}
                  activeStage={activeStage}
                  onStageClick={setStageFilter}
                />

                {activeStage && (
                  <div className="flex items-center justify-between bg-gray-900/60 border border-gray-800 rounded-lg px-4 py-3">
                    <p className="text-sm text-slate-300">
                      <span className="text-slate-400">{UI_COPY.dashboard.filters.stagePrefix}:</span>{' '}
                      <span className="text-yellow-400 font-semibold">
                        {activeStage ? PIPELINE_STAGE_CONFIG_BY_ID[activeStage].label : ''}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={clearStageFilter}
                      className="text-xs font-semibold text-yellow-400 hover:text-yellow-300"
                    >
                      {UI_COPY.dashboard.filters.clearStage}
                    </button>
                  </div>
                )}

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                  <PriorityActions
                    actions={priorityActions}
                    onActionPrimaryClick={(action) => router.push(action.primaryCta.href)}
                    onActionSecondaryClick={(action) => router.push(action.secondaryCta.href)}
                    onCreateNew={openCreateContent}
                  />

                  <ProductionsList
                    productions={filteredProductions}
                    onProductionClick={(production) => router.push(`/productions/${production.id}`)}
                  />

                  <div className="space-y-6">
                      <AutomationRuns runs={data.runs} />

                    <motion.div
                      className="surface-card glow-hover p-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em] mb-4">{UI_COPY.dashboard.sections.social}</div>
                      <div className="space-y-3">
                        <div className="flex flex-col gap-3 rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                              <Instagram className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-white">{UI_COPY.social.instagram.label}</p>
                              <p className="text-xs text-slate-400">{UI_COPY.social.instagram.description}</p>
                            </div>
                          </div>
                          <button className="w-full text-xs font-semibold text-yellow-400 hover:text-yellow-300 sm:w-auto">{UI_COPY.social.instagram.action}</button>
                        </div>
                        <div className="flex flex-col gap-3 rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                              <Music2 className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-white">{UI_COPY.social.tiktok.label}</p>
                              <p className="text-xs text-slate-400">{UI_COPY.social.tiktok.description}</p>
                            </div>
                          </div>
                          <button className="w-full text-xs font-semibold text-yellow-400 hover:text-yellow-300 sm:w-auto">{UI_COPY.social.tiktok.action}</button>
                        </div>
                        <div className="flex flex-col gap-3 rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                              <Linkedin className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-white">{UI_COPY.social.linkedin.label}</p>
                              <p className="text-xs text-slate-400">{UI_COPY.social.linkedin.description}</p>
                            </div>
                          </div>
                          <button className="w-full text-xs font-semibold text-yellow-400 hover:text-yellow-300 sm:w-auto">{UI_COPY.social.linkedin.action}</button>
                        </div>
                      </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                      className="surface-card glow-hover p-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em] mb-4">{UI_COPY.dashboard.sections.summary}</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <div className="text-4xl font-semibold text-white">{data.productions.length}</div>
                          <div className="text-sm text-slate-400">{UI_COPY.summary.total}</div>
                          <div className="text-xs text-slate-500 mt-1">{UI_COPY.summary.totalHint}</div>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <div className="text-4xl font-semibold text-yellow-400">{activeProductions.length}</div>
                          <div className="text-sm text-slate-400">{UI_COPY.summary.active}</div>
                          <div className="text-xs text-slate-500 mt-1">{UI_COPY.summary.activeHint}</div>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <div className="text-4xl font-semibold text-cyan-400">{data.ideasCount}</div>
                          <div className="text-sm text-slate-400">{UI_COPY.summary.ideas}</div>
                          <div className="text-xs text-slate-500 mt-1">{UI_COPY.summary.ideasHint}</div>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <div className="text-4xl font-semibold text-emerald-400">{data.pipelineStats.published}</div>
                          <div className="text-sm text-slate-400">{UI_COPY.summary.published}</div>
                          <div className="text-xs text-slate-500 mt-1">{UI_COPY.summary.publishedHint}</div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            )}
        </main>
      </PageTransition>
      <Footer />

      {/* Modal */}
      {showModal && (
        <motion.div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowModal(false)}
        >
          <motion.div
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-semibold text-white mb-5">{UI_COPY.dashboard.createLabel}</h3>
            {createError && <p className="text-sm text-red-400 mb-4">{createError}</p>}
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={UI_COPY.dashboard.createPlaceholder}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-5 py-4 text-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none mb-5"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-4">
              <motion.button
                onClick={() => setShowModal(false)}
                className="flex-1 px-5 py-3 text-base border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {UI_COPY.ideas.form.cancel}
              </motion.button>
              <motion.button
                onClick={handleCreate}
                disabled={isCreating}
                className="flex-1 px-5 py-3 text-base bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isCreating ? UI_COPY.dashboard.creatingLabel : UI_COPY.dashboard.createLabel}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-300">{UI_COPY.dashboard.loading}</p>
            </div>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
