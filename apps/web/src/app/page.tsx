'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import ChannelCard from './components/ChannelCard';

interface Channel {
  id: string;
  name: string;
  subscribers: number;
  lastVideo?: string;
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

  const titleVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.05,
      },
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          <motion.div className="mb-8" variants={titleVariants}>
            <h2 className="text-4xl font-bold text-black dark:text-white mb-2">
              Mis Canales
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Gestiona y automatiza tus canales de YouTube
            </p>
          </motion.div>

          {loading && (
            <motion.div
              className="flex items-center justify-center py-12"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="text-gray-600 dark:text-gray-400">Cargando canales...</div>
            </motion.div>
          )}

          {error && (
            <motion.div
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Error: {error}
            </motion.div>
          )}

          {!loading && channels.length === 0 && !error && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No hay canales configurados aún
              </p>
              <motion.button
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Conectar Canal
              </motion.button>
            </motion.div>
          )}

          {!loading && channels.length > 0 && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={gridVariants}
              initial="hidden"
              animate="visible"
            >
              {channels.map((channel, index) => (
                <ChannelCard key={channel.id} {...channel} index={index} />
              ))}
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
