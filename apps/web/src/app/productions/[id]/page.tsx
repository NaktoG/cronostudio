'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Image as ImageIcon, Search, Video } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../components/Header';
import BackToDashboard from '../../components/BackToDashboard';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../../contexts/AuthContext';
import { UI_COPY } from '@/config/uiCopy';
import { useProduction } from '@/hooks/useProduction';
import { PIPELINE_STAGE_CONFIG_BY_ID } from '@/domain/configs/pipeline';
import { ACTION_ROUTES, STATUS_ROUTES } from '@/config/routes';
import type { ProductionStatus } from '@/domain/types';

const STATUS_STYLES: Record<ProductionStatus, string> = {
  idea: 'bg-slate-600',
  scripting: 'bg-blue-600',
  recording: 'bg-purple-600',
  editing: 'bg-orange-600',
  shorts: 'bg-cyan-600',
  publishing: 'bg-yellow-600',
  published: 'bg-emerald-600',
};

export default function ProductionDetailPage() {
  const params = useParams();
  const productionId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const authFetch = useAuthFetch();
  const { production, loading, error, fetchProduction } = useProduction(authFetch, isAuthenticated);

  useEffect(() => {
    if (productionId) {
      fetchProduction(productionId);
    }
  }, [fetchProduction, productionId]);

  const handleViewPipeline = () => {
    if (!production) return;
    router.push(PIPELINE_STAGE_CONFIG_BY_ID[production.status].route);
  };

  const handleViewSection = () => {
    if (!production) return;
    router.push(STATUS_ROUTES[production.status]);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
          <BackToDashboard />
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="surface-card glow-hover p-6 text-center text-red-400">{error}</div>
          ) : production ? (
            <motion.div
              className="surface-card glow-hover p-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs px-2 py-1 rounded ${STATUS_STYLES[production.status]} text-white`}>
                      {UI_COPY.productionStatusLabels[production.status]}
                    </span>
                    <span className="text-xs text-slate-400">{UI_COPY.productionDetail.statusLabel}</span>
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-yellow-400/90 mb-2">
                    {UI_COPY.productionDetail.titlePrefix}
                  </div>
                  <h2 className="text-3xl font-semibold text-white mb-2">{production.title}</h2>
                  {production.description && (
                    <p className="text-slate-300">{production.description}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleViewPipeline}
                    className="px-4 py-2 text-sm font-semibold text-yellow-400 border border-yellow-400/40 rounded-lg hover:bg-yellow-400/10"
                  >
                    {UI_COPY.productionDetail.actions.viewPipeline}
                  </button>
                  <button
                    type="button"
                    onClick={handleViewSection}
                    className="px-4 py-2 text-sm font-semibold text-slate-200 border border-gray-700 rounded-lg hover:bg-gray-800"
                  >
                    {UI_COPY.productionDetail.actions.viewSection}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => router.push(ACTION_ROUTES.script)}
                    className="flex items-center gap-3 border border-gray-800 rounded-lg px-4 py-3 text-left hover:border-yellow-500/40"
                  >
                    <FileText className="w-5 h-5 text-yellow-400" />
                    <span className="text-slate-200">{UI_COPY.productionDetail.links.scripts}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(ACTION_ROUTES.thumbnail)}
                    className="flex items-center gap-3 border border-gray-800 rounded-lg px-4 py-3 text-left hover:border-yellow-500/40"
                  >
                    <ImageIcon className="w-5 h-5 text-yellow-400" />
                    <span className="text-slate-200">{UI_COPY.productionDetail.links.thumbnails}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(ACTION_ROUTES.seo)}
                    className="flex items-center gap-3 border border-gray-800 rounded-lg px-4 py-3 text-left hover:border-yellow-500/40"
                  >
                    <Search className="w-5 h-5 text-yellow-400" />
                    <span className="text-slate-200">{UI_COPY.productionDetail.links.seo}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(ACTION_ROUTES.short)}
                    className="flex items-center gap-3 border border-gray-800 rounded-lg px-4 py-3 text-left hover:border-yellow-500/40"
                  >
                    <Video className="w-5 h-5 text-yellow-400" />
                    <span className="text-slate-200">{UI_COPY.productionDetail.links.videos}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="surface-card glow-hover p-6 text-center text-slate-300">
              {UI_COPY.errors.fallbackDescription}
            </div>
          )}
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
