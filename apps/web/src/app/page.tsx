'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Linkedin, Music2, Plus, Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { PageTransition } from './components/Animations';
import PriorityActions from './components/PriorityActions';
import ProductionPipeline from './components/ProductionPipeline';
import ProductionsList, { Production } from './components/ProductionsList';
import AutomationRuns, { AutomationRun } from './components/AutomationRuns';
import { useAuth, useAuthFetch } from './contexts/AuthContext';

interface PipelineStats {
  idea: number;
  scripting: number;
  recording: number;
  editing: number;
  shorts: number;
  publishing: number;
  published: number;
}

interface PriorityAction {
  id: string;
  type: 'script' | 'seo' | 'thumbnail' | 'short' | 'publish';
  title: string;
  productionTitle: string;
  productionId: string;
  urgency: 'high' | 'medium' | 'low';
}

function generatePriorityActions(productions: Production[]): PriorityAction[] {
  const actions: PriorityAction[] = [];
  for (const prod of productions) {
    if (prod.status === 'scripting' && (!prod.script_status || prod.script_status === 'draft')) {
      actions.push({ id: prod.id, type: 'script', title: 'Continuar guión', productionTitle: prod.title, productionId: prod.id, urgency: 'high' });
    }
    if ((prod.status === 'editing' || prod.status === 'shorts') && (!prod.thumbnail_status || prod.thumbnail_status === 'pending')) {
      actions.push({ id: `${prod.id}-thumb`, type: 'thumbnail', title: 'Subir miniatura', productionTitle: prod.title, productionId: prod.id, urgency: 'medium' });
    }
    if ((prod.status === 'editing' || prod.status === 'publishing') && (!prod.seo_score || prod.seo_score < 60)) {
      actions.push({ id: `${prod.id}-seo`, type: 'seo', title: 'Optimizar SEO', productionTitle: prod.title, productionId: prod.id, urgency: 'medium' });
    }
    if (prod.status === 'shorts' && prod.shorts_count === 0) {
      actions.push({ id: `${prod.id}-short`, type: 'short', title: 'Crear shorts', productionTitle: prod.title, productionId: prod.id, urgency: 'low' });
    }
  }
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  return actions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]).slice(0, 5);
}

function DashboardContent() {
  const { isAuthenticated } = useAuth();
  const authFetch = useAuthFetch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [productions, setProductions] = useState<Production[]>([]);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats>({
    idea: 0, scripting: 0, recording: 0, editing: 0, shorts: 0, publishing: 0, published: 0
  });
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [ideasCount, setIdeasCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [productionsRes, ideasRes, runsRes] = await Promise.all([
        authFetch('/api/productions?stats=true'),
        authFetch('/api/ideas'),
        authFetch('/api/automation-runs')
      ]);

      if (productionsRes.ok) {
        const data = await productionsRes.json();
        setProductions(data.productions || []);
        if (data.pipeline) {
          setPipelineStats({
            idea: data.pipeline.idea || 0,
            scripting: data.pipeline.scripting || 0,
            recording: data.pipeline.recording || 0,
            editing: data.pipeline.editing || 0,
            shorts: data.pipeline.shorts || 0,
            publishing: data.pipeline.publishing || 0,
            published: data.pipeline.published || 0,
          });
        }
      }

      if (ideasRes.ok) {
        const ideasData = await ideasRes.json();
        setIdeasCount(Array.isArray(ideasData) ? ideasData.length : 0);
      }
      if (runsRes.ok) {
        const runsData = await runsRes.json();
        setRuns(Array.isArray(runsData) ? runsData : []);
      } else {
        setRuns([]);
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (isAuthenticated) fetchData();
    else setLoading(false);
  }, [isAuthenticated, fetchData]);

  useEffect(() => {
    if (searchParams?.get('new') === '1') {
      setShowModal(true);
    }
  }, [searchParams]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await authFetch('/api/productions', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setNewTitle('');
        setShowModal(false);
        fetchData();
      }
    } catch (e) {
      console.error('Error:', e);
    }
  };

  const priorityActions = generatePriorityActions(productions);
  const activeProductions = productions.filter(p => p.status !== 'published');

  const getStageRoute = (stage: keyof PipelineStats) => {
    switch (stage) {
      case 'idea':
        return '/ideas';
      case 'scripting':
        return '/scripts';
      case 'recording':
        return '/videos';
      case 'editing':
        return '/thumbnails';
      case 'shorts':
        return '/videos';
      case 'publishing':
        return '/seo';
      case 'published':
        return '/analytics';
      default:
        return '/videos';
    }
  };

  const getProductionRoute = (production: Production) => {
    switch (production.status) {
      case 'idea':
        return '/ideas';
      case 'scripting':
        return '/scripts';
      case 'recording':
        return '/videos';
      case 'editing':
        return '/thumbnails';
      case 'shorts':
        return '/videos';
      case 'publishing':
        return '/seo';
      case 'published':
        return '/analytics';
      default:
        return '/videos';
    }
  };

  const getActionRoute = (action: PriorityAction) => {
    switch (action.type) {
      case 'script':
        return '/scripts';
      case 'seo':
        return '/seo';
      case 'thumbnail':
        return '/thumbnails';
      case 'short':
        return '/videos';
      case 'publish':
        return '/analytics';
      default:
        return '/videos';
    }
  };

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
                    Control de produccion
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-3">
                    Hoy en tu produccion
                  </h1>
                  <p className="text-base md:text-lg text-slate-300 max-w-2xl">
                    Tu centro de comando para planificar, producir y publicar contenido con claridad.
                  </p>
                </div>
                <motion.button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-black rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(246, 201, 69, 0.95), rgba(246, 201, 69, 0.7))',
                    boxShadow: '0 10px 20px rgba(246, 201, 69, 0.22)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-4 h-4" />
                  Nuevo contenido
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
                  stats={pipelineStats}
                  onStageClick={(stage) => router.push(getStageRoute(stage))}
                />

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                  <PriorityActions
                    actions={priorityActions}
                    onCreateNew={() => setShowModal(true)}
                    onActionClick={(action) => router.push(getActionRoute(action))}
                  />

                  <ProductionsList
                    productions={activeProductions}
                    onProductionClick={(production) => router.push(getProductionRoute(production))}
                  />

                  <div className="space-y-6">
                    <AutomationRuns runs={runs} />

                    <motion.div
                      className="surface-card glow-hover p-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em] mb-4">Redes sociales</div>
                      <div className="space-y-3">
                        <div className="flex flex-col gap-3 rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                              <Instagram className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-white">Instagram</p>
                              <p className="text-xs text-slate-400">Reels, posts y stories</p>
                            </div>
                          </div>
                          <button className="w-full text-xs font-semibold text-yellow-400 hover:text-yellow-300 sm:w-auto">Conectar</button>
                        </div>
                        <div className="flex flex-col gap-3 rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                              <Music2 className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-white">TikTok</p>
                              <p className="text-xs text-slate-400">Clips cortos y trends</p>
                            </div>
                          </div>
                          <button className="w-full text-xs font-semibold text-yellow-400 hover:text-yellow-300 sm:w-auto">Conectar</button>
                        </div>
                        <div className="flex flex-col gap-3 rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                              <Linkedin className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-white">LinkedIn</p>
                              <p className="text-xs text-slate-400">Posts, clips y branding</p>
                            </div>
                          </div>
                          <button className="w-full text-xs font-semibold text-yellow-400 hover:text-yellow-300 sm:w-auto">Conectar</button>
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
                      <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em] mb-4">Resumen</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <div className="text-4xl font-semibold text-white">{productions.length}</div>
                          <div className="text-sm text-slate-400">Total</div>
                          <div className="text-xs text-slate-500 mt-1">+2 esta semana</div>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <div className="text-4xl font-semibold text-yellow-400">{activeProductions.length}</div>
                          <div className="text-sm text-slate-400">Activos</div>
                          <div className="text-xs text-slate-500 mt-1">Prioridad alta</div>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <div className="text-4xl font-semibold text-cyan-400">{ideasCount}</div>
                          <div className="text-sm text-slate-400">Ideas</div>
                          <div className="text-xs text-slate-500 mt-1">+3 nuevas</div>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <div className="text-4xl font-semibold text-emerald-400">{pipelineStats.published}</div>
                          <div className="text-sm text-slate-400">Publicados</div>
                          <div className="text-xs text-slate-500 mt-1">Meta semanal</div>
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

        <motion.button
          onClick={() => setShowModal(true)}
          className="fixed bottom-6 right-6 md:hidden flex items-center gap-2 px-5 py-3 text-sm font-semibold text-black rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgba(246, 201, 69, 0.95), rgba(246, 201, 69, 0.7))',
            boxShadow: '0 10px 20px rgba(246, 201, 69, 0.22)',
          }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus className="w-4 h-4" />
        Nuevo
      </motion.button>

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
            <h3 className="text-2xl font-semibold text-white mb-5">Nuevo contenido</h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título del contenido..."
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
                Cancelar
              </motion.button>
              <motion.button
                onClick={handleCreate}
                className="flex-1 px-5 py-3 text-base bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Crear contenido
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
              <p className="text-slate-300">Cargando dashboard...</p>
            </div>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
