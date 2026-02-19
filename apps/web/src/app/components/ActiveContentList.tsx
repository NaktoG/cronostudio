'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, FileText, Film, Lightbulb, Smartphone, Scissors, Upload, Video } from 'lucide-react';
import type { ActiveContentItem, IdeaStatus, ProductionStatus } from '@/domain/types';
import { UI_COPY } from '@/config/uiCopy';

interface ActiveContentListProps {
  items: ActiveContentItem[];
  activeStage: ProductionStatus | null;
  onProductionClick?: (id: string) => void;
  onIdeaClick?: (id: string) => void;
  onCreateIdea?: () => void;
  onViewAllIdeas?: () => void;
}

const STATUS_BADGE: Record<ProductionStatus, { label: string; color: string; icon: typeof Lightbulb }> = {
  idea: { label: UI_COPY.productionStatusLabels.idea, color: 'bg-slate-600', icon: Lightbulb },
  scripting: { label: UI_COPY.productionStatusLabels.scripting, color: 'bg-blue-600', icon: FileText },
  recording: { label: UI_COPY.productionStatusLabels.recording, color: 'bg-purple-600', icon: Video },
  editing: { label: UI_COPY.productionStatusLabels.editing, color: 'bg-orange-600', icon: Scissors },
  shorts: { label: UI_COPY.productionStatusLabels.shorts, color: 'bg-cyan-600', icon: Smartphone },
  publishing: { label: UI_COPY.productionStatusLabels.publishing, color: 'bg-yellow-600', icon: Upload },
  published: { label: UI_COPY.productionStatusLabels.published, color: 'bg-emerald-600', icon: CheckCircle2 },
};

const IDEA_STATUS_BADGE: Record<IdeaStatus, { label: string; color: string }> = {
  draft: { label: UI_COPY.ideas.statusLabels.draft, color: 'bg-gray-600' },
  approved: { label: UI_COPY.ideas.statusLabels.approved, color: 'bg-green-600' },
  in_production: { label: UI_COPY.ideas.statusLabels.in_production, color: 'bg-yellow-600' },
  completed: { label: UI_COPY.ideas.statusLabels.completed, color: 'bg-blue-600' },
  archived: { label: UI_COPY.ideas.statusLabels.archived, color: 'bg-gray-800' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function ActiveContentList({
  items,
  activeStage,
  onProductionClick,
  onIdeaClick,
  onCreateIdea,
  onViewAllIdeas,
}: ActiveContentListProps) {
  const isIdeaStage = activeStage === 'idea';
  const hasItems = items.length > 0;

  return (
    <motion.div
      className="surface-card glow-hover overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/60">
        <span className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">
          {UI_COPY.dashboard.sections.active}
        </span>
        {isIdeaStage && onViewAllIdeas && (
          <button
            type="button"
            onClick={onViewAllIdeas}
            className="text-xs font-semibold text-yellow-400 hover:text-yellow-300"
          >
            {UI_COPY.activeContent.viewAllIdeas}
          </button>
        )}
      </div>

      <motion.div className="divide-y divide-gray-800/50" variants={containerVariants} initial="hidden" animate="visible">
        {!hasItems ? (
          <motion.div
            className="px-5 py-6 text-center hover:bg-gray-800/40 transition-colors"
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
          >
            <span className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-900/70 border border-gray-800 flex items-center justify-center text-yellow-400">
              {isIdeaStage ? <Lightbulb className="w-6 h-6" /> : <Film className="w-6 h-6" />}
            </span>
            <span className="text-base text-slate-300 block mb-1">
              {isIdeaStage ? UI_COPY.activeContent.ideasEmptyTitle : UI_COPY.productions.emptyTitle}
            </span>
            <span className="text-sm text-slate-400">
              {isIdeaStage ? UI_COPY.activeContent.ideasEmptyDescription : UI_COPY.productions.emptyDescription}
            </span>
            {isIdeaStage && onCreateIdea && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={onCreateIdea}
                  className="text-xs font-semibold text-yellow-400 hover:text-yellow-300"
                >
                  {UI_COPY.activeContent.createIdea}
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          items.slice(0, 6).map((item) => {
            if (item.kind === 'idea') {
              const statusBadge = IDEA_STATUS_BADGE[item.status];
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/40 cursor-pointer transition-colors group w-full text-left"
                  onClick={() => onIdeaClick?.(item.id)}
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                  aria-label={`${UI_COPY.activeContent.openIdea} ${item.title}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                      <Lightbulb className="w-4 h-4" />
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-md ${statusBadge.color} text-white font-medium`}>
                      {statusBadge.label}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-base font-medium text-white truncate block">{item.title}</span>
                    <span className="text-sm text-slate-400 truncate block">
                      {item.description || UI_COPY.activeContent.ideaFallbackDescription}
                    </span>
                  </div>

                  <motion.span
                    className="text-gray-600 group-hover:text-yellow-400 transition-colors text-lg"
                    initial={{ x: 0 }}
                    whileHover={{ x: 3 }}
                  >
                    →
                  </motion.span>
                </motion.button>
              );
            }

            const badge = STATUS_BADGE[item.stage];
            const Icon = badge.icon;

            return (
              <motion.button
                key={item.id}
                type="button"
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/40 cursor-pointer transition-colors group w-full text-left"
                onClick={() => onProductionClick?.(item.id)}
                variants={itemVariants}
                whileHover={{ x: 4 }}
                aria-label={`${UI_COPY.productions.openLabel} ${item.title}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-md ${badge.color} text-white font-medium`}>
                    {badge.label}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-base font-medium text-white truncate block">{item.title}</span>
                  <span className="text-sm text-slate-400 truncate block">
                    {UI_COPY.nextActionLabels[item.stage] || UI_COPY.nextActionLabels.idea}
                  </span>
                </div>

                <motion.span
                  className="text-gray-600 group-hover:text-yellow-400 transition-colors text-lg"
                  initial={{ x: 0 }}
                  whileHover={{ x: 3 }}
                >
                  →
                </motion.span>
              </motion.button>
            );
          })
        )}
      </motion.div>
    </motion.div>
  );
}
