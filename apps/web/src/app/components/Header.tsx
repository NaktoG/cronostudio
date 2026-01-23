'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.3,
        duration: 0.5,
      },
    },
  };

  return (
    <motion.header
      className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-yellow-500/30"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <motion.div className="flex items-center gap-3" variants={textVariants}>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-400/20">
              <span className="text-black font-bold text-lg">C</span>
            </div>
            <h1 className="text-2xl font-bold text-white">CronoStudio</h1>
          </Link>
        </motion.div>

        <motion.nav className="hidden md:flex items-center gap-8" variants={textVariants}>
          <Link
            href="/"
            className="text-gray-400 hover:text-yellow-400 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/channels"
            className="text-gray-400 hover:text-yellow-400 transition-colors"
          >
            Canales
          </Link>
          <Link
            href="/analytics"
            className="text-gray-400 hover:text-yellow-400 transition-colors"
          >
            Analytics
          </Link>
        </motion.nav>

        <motion.div className="flex items-center gap-4" variants={textVariants}>
          {isLoading ? (
            <div className="w-24 h-10 bg-gray-800 rounded-lg animate-pulse" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <motion.button
                onClick={logout}
                className="px-4 py-2 text-sm text-gray-400 hover:text-yellow-400 border border-gray-700 rounded-lg hover:border-yellow-500/50 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Salir
              </motion.button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <motion.button
                  className="px-4 py-2 text-sm text-gray-300 hover:text-yellow-400 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Iniciar Sesión
                </motion.button>
              </Link>
              <Link href="/register">
                <motion.button
                  className="px-4 py-2 text-sm bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/25 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Registrarse
                </motion.button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </motion.header>
  );
}
