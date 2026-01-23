'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

interface Channel {
  id: string;
  name: string;
  youtube_channel_id?: string;
  subscribers: number;
  created_at?: string;
}

export default function Dashboard() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/channels');

        if (!response.ok) {
          throw new Error('Failed to fetch channels');
        }

        const data = await response.json();
        setChannels(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar canales');
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black flex flex-col">
        <Header />

        <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
          <motion.div initial="hidden" animate="visible" variants={containerVariants}>
            {/* Título */}
            <motion.div className="mb-8" variants={itemVariants}>
              <h2 className="text-4xl font-bold text-white mb-2">
                Mis Canales
              </h2>
              <p className="text-gray-400">
                Gestiona y automatiza tus canales de YouTube
              </p>
            </motion.div>

            {/* Loading */}
            {loading && (
              <motion.div
                className="flex items-center justify-center py-20"
                variants={itemVariants}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-400">Cargando canales...</p>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400"
                variants={itemVariants}
              >
                Error: {error}
              </motion.div>
            )}

            {/* Empty State */}
            {!loading && channels.length === 0 && !error && (
              <motion.div
                className="text-center py-20"
                variants={itemVariants}
              >
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No hay canales configurados</h3>
                <p className="text-gray-400 mb-6">
                  Conecta tu primer canal de YouTube para comenzar
                </p>
                <Link href="/channels">
                  <motion.button
                    className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/25 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Conectar Canal
                  </motion.button>
                </Link>
              </motion.div>
            )}

            {/* Lista de canales */}
            {!loading && channels.length > 0 && (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
              >
                {channels.map((channel) => (
                  <motion.div
                    key={channel.id}
                    variants={itemVariants}
                    className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/10 rounded-xl p-6 hover:border-yellow-500/30 transition-all group"
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      </div>
                      {channel.youtube_channel_id && (
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                          ID: {channel.youtube_channel_id.slice(0, 8)}...
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                      {channel.name}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {channel.subscribers?.toLocaleString() || 0} subs
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                      {channel.created_at && (
                        <span className="text-xs text-gray-500">
                          Añadido: {new Date(channel.created_at).toLocaleDateString('es-ES')}
                        </span>
                      )}
                      <Link
                        href={`/analytics?channelId=${channel.id}`}
                        className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                      >
                        Ver Analytics →
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Quick Actions */}
            {!loading && (
              <motion.div
                className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
                variants={containerVariants}
              >
                <Link href="/channels">
                  <motion.div
                    className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/30 transition-all cursor-pointer group"
                    whileHover={{ y: -2 }}
                    variants={itemVariants}
                  >
                    <div className="w-10 h-10 bg-yellow-400/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-400/20 transition-colors">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <h4 className="text-white font-medium mb-1">Gestionar Canales</h4>
                    <p className="text-sm text-gray-400">Añade o edita tus canales</p>
                  </motion.div>
                </Link>

                <Link href="/analytics">
                  <motion.div
                    className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/30 transition-all cursor-pointer group"
                    whileHover={{ y: -2 }}
                    variants={itemVariants}
                  >
                    <div className="w-10 h-10 bg-yellow-400/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-400/20 transition-colors">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="text-white font-medium mb-1">Ver Analytics</h4>
                    <p className="text-sm text-gray-400">Métricas de rendimiento</p>
                  </motion.div>
                </Link>

                <motion.div
                  className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 opacity-50 cursor-not-allowed"
                  variants={itemVariants}
                >
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h4 className="text-gray-500 font-medium mb-1">Automatizaciones</h4>
                  <p className="text-sm text-gray-600">Próximamente</p>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
