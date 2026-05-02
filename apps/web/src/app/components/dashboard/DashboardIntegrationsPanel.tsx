'use client';

import { motion } from 'framer-motion';
import { Instagram, Linkedin, Music2, Twitter } from 'lucide-react';
import type { ReactNode } from 'react';

import type { getDashboardCopy } from '@/app/content/dashboard';

interface DashboardIntegrationsPanelProps {
  dashboardCopy: ReturnType<typeof getDashboardCopy>;
  activeTab: string;
}

export default function DashboardIntegrationsPanel({ dashboardCopy, activeTab }: DashboardIntegrationsPanelProps) {
  return (
    <motion.div className={`space-y-4 ${activeTab === 'integrations' ? '' : 'hidden'}`} data-tour="integrations">
      <motion.div
        className="surface-card glow-hover p-4 sm:p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em] mb-4 text-center sm:text-left">{dashboardCopy.social.title}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3">
          {dashboardCopy.social.items.map((item) => {
            const iconMap: Record<string, ReactNode> = {
              Instagram: <Instagram className="w-4 h-4" />,
              TikTok: <Music2 className="w-4 h-4" />,
              LinkedIn: <Linkedin className="w-4 h-4" />,
              X: <Twitter className="w-4 h-4" />,
            };
            return (
              <div key={item.name} className="flex flex-col gap-3 rounded-lg border border-gray-800 bg-gray-900/60 px-3 sm:px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                    {iconMap[item.name]}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.description}</p>
                  </div>
                </div>
                <button className="w-full text-xs font-semibold text-yellow-400 hover:text-yellow-300 sm:w-auto">{dashboardCopy.social.connect}</button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
