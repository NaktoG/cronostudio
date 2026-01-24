'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { PageTransition, StaggerContainer, StaggerItem, staggerItem } from './components/Animations';

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
        <PageTransition className="flex-1">
          <main className="max-w-7xl mx-auto px-6 py-12 w-full">
            {/* Welcome Section */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <h2 className="text-4xl font-bold text-white mb-2">Dashboard</h2>
              <p className="text-gray-400">Gestiona tu contenido de YouTube desde un solo lugar</p>
            </motion.div>

            {/* Module Cards with Stagger Animation */}
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {MODULES.map((module) => (
                <StaggerItem key={module.href}>
                  <Link href={module.href}>
                    <motion.div
                      className={`bg-gradient-to-br ${module.color} border border-yellow-500/10 rounded-xl p-6 hover:border-yellow-500/40 transition-colors cursor-pointer group h-full`}
                      whileHover={{ y: -6, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <motion.div
                        className="text-4xl mb-4"
                        whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.3 }}
                      >
                        {module.icon}
                      </motion.div>
                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                        {module.title}
                      </h3>
                      <p className="text-gray-400 text-sm">{module.description}</p>
                    </motion.div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Recent Channels Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Tus Canales</h3>
                <Link
                  href="/channels"
                  className="text-yellow-400 hover:text-yellow-300 text-sm flex items-center gap-1 group"
                >
                  Ver todos
                  <motion.svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    whileHover={{ x: 4 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </motion.svg>
                </Link>
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <motion.div
                    className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              ) : channels.length === 0 ? (
                <motion.div
                  className="bg-gray-900/50 border border-yellow-500/10 rounded-xl p-8 text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.div
                    className="text-4xl mb-4"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    📺
                  </motion.div>
                  <h4 className="text-lg font-semibold text-white mb-2">No hay canales todavía</h4>
                  <p className="text-gray-400 mb-4">Añade tu primer canal de YouTube para empezar</p>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/channels"
                      className="inline-block px-6 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition-all"
                    >
                      Añadir Canal
                    </Link>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  variants={{
                    animate: { transition: { staggerChildren: 0.1, delayChildren: 0.6 } }
                  }}
                  initial="initial"
                  animate="animate"
                >
                  {channels.slice(0, 3).map((channel) => (
                    <motion.div
                      key={channel.id}
                      className="bg-gray-900/50 border border-yellow-500/10 rounded-xl p-5 hover:border-yellow-500/30 transition-all cursor-pointer"
                      variants={staggerItem}
                      whileHover={{ x: 6, borderColor: 'rgba(250, 204, 21, 0.4)' }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          📺
                        </motion.div>
                        <div>
                          <h4 className="font-semibold text-white">{channel.name}</h4>
                          <p className="text-xs text-gray-500 font-mono">{channel.youtube_channel_id}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </main>
        </PageTransition>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
