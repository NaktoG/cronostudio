'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { PageTransition } from './components/Animations';
import PriorityActions from './components/PriorityActions';
import ProductionPipeline from './components/ProductionPipeline';
import ProductionsList, { Production } from './components/ProductionsList';
import AutomationRuns, { AutomationRun } from './components/AutomationRuns';
import { useAuth } from './contexts/AuthContext';

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

export default function Dashboard() {
  const { token, isAuthenticated } = useAuth();
  const [productions, setProductions] = useState<Production[]>([]);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats>({
    idea: 0, scripting: 0, recording: 0, editing: 0, shorts: 0, publishing: 0, published: 0
  });
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [ideasCount, setIdeasCount] = useState(0);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');
    return fetch(url, { ...options, headers });
  }, [token]);

  const fetchData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [productionsRes, ideasRes] = await Promise.all([
        authFetch('/api/productions?stats=true'),
        authFetch('/api/ideas')
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
      setRuns([]);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  }, [token, authFetch]);

  useEffect(() => {
    if (isAuthenticated) fetchData();
    else setLoading(false);
  }, [isAuthenticated, fetchData]);

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black flex flex-col">
        <Header />
        <PageTransition className="flex-1">
          <main className="w-full px-4 md:px-8 lg:px-12 py-8">
            {/* Header */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Hoy en tu producción</h1>
              <p className="text-lg text-gray-400">Tu centro de control de contenido</p>
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
                <ProductionPipeline stats={pipelineStats} />

                {/* Main grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <PriorityActions
                    actions={priorityActions}
                    onCreateNew={() => setShowModal(true)}
                  />

                  <ProductionsList
                    productions={activeProductions}
                    onCreateNew={() => setShowModal(true)}
                  />

                  <div className="space-y-6">
                    <AutomationRuns runs={runs} />

                    {/* Stats */}
                    <motion.div
                      className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">📈 Resumen</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="text-4xl font-bold text-white">{productions.length}</div>
                          <div className="text-base text-gray-500">Total</div>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="text-4xl font-bold text-yellow-400">{activeProductions.length}</div>
                          <div className="text-base text-gray-500">Activos</div>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="text-4xl font-bold text-blue-400">{ideasCount}</div>
                          <div className="text-base text-gray-500">Ideas</div>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="text-4xl font-bold text-green-400">{pipelineStats.published}</div>
                          <div className="text-base text-gray-500">Publicados</div>
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
              <h3 className="text-2xl font-bold text-white mb-5">🎬 Nuevo contenido</h3>
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
    </ProtectedRoute>
  );
}
