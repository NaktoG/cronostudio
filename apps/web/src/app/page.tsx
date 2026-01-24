'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

interface Channel {
  id: string;
  name: string;
  youtube_channel_id: string;
}

const MODULES = [
  { href: '/ideas', icon: '💡', title: 'Ideas', description: 'Apunta ideas para tus próximos videos', color: 'from-yellow-500/20 to-yellow-600/5' },
  { href: '/scripts', icon: '📝', title: 'Guiones', description: 'Escribe y organiza tus guiones', color: 'from-blue-500/20 to-blue-600/5' },
  { href: '/thumbnails', icon: '🖼️', title: 'Miniaturas', description: 'Gestiona tus thumbnails', color: 'from-purple-500/20 to-purple-600/5' },
  { href: '/seo', icon: '🔍', title: 'SEO', description: 'Optimiza títulos, tags y descripciones', color: 'from-green-500/20 to-green-600/5' },
  { href: '/channels', icon: '📺', title: 'Canales', description: 'Administra tus canales de YouTube', color: 'from-red-500/20 to-red-600/5' },
  { href: '/analytics', icon: '📊', title: 'Analytics', description: 'Visualiza métricas y rendimiento', color: 'from-cyan-500/20 to-cyan-600/5' },
];

export default function Dashboard() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch('/api/channels');
        if (response.ok) {
          const data = await response.json();
          setChannels(data);
        }
      } catch (error) {
        console.error('Error fetching channels:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
          {/* Welcome Section */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-4xl font-bold text-white mb-2">Dashboard</h2>
            <p className="text-gray-400">Gestiona tu contenido de YouTube desde un solo lugar</p>
          </motion.div>

          {/* Module Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {MODULES.map((module, index) => (
              <Link key={module.href} href={module.href}>
                <motion.div
                  className={`bg-gradient-to-br ${module.color} border border-yellow-500/10 rounded-xl p-6 hover:border-yellow-500/40 transition-all cursor-pointer group h-full`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                >
                  <div className="text-4xl mb-4">{module.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{module.description}</p>
                </motion.div>
              </Link>
            ))}
          </motion.div>

          {/* Recent Channels Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Tus Canales</h3>
              <Link
                href="/channels"
                className="text-yellow-400 hover:text-yellow-300 text-sm flex items-center gap-1"
              >
                Ver todos
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : channels.length === 0 ? (
              <div className="bg-gray-900/50 border border-yellow-500/10 rounded-xl p-8 text-center">
                <div className="text-4xl mb-4">📺</div>
                <h4 className="text-lg font-semibold text-white mb-2">No hay canales todavía</h4>
                <p className="text-gray-400 mb-4">Añade tu primer canal de YouTube para empezar</p>
                <Link
                  href="/channels"
                  className="inline-block px-6 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition-all"
                >
                  Añadir Canal
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {channels.slice(0, 3).map((channel) => (
                  <motion.div
                    key={channel.id}
                    className="bg-gray-900/50 border border-yellow-500/10 rounded-xl p-5 hover:border-yellow-500/30 transition-all"
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl">
                        📺
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{channel.name}</h4>
                        <p className="text-xs text-gray-500 font-mono">{channel.youtube_channel_id}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
