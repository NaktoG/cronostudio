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
      className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <motion.div className="flex items-center gap-3" variants={textVariants}>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <h1 className="text-2xl font-bold text-white">CronoStudio</h1>
          </Link>
        </motion.div>

        <motion.nav className="hidden md:flex items-center gap-8" variants={textVariants}>
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/channels"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Canales
          </Link>
          <Link
            href="/analytics"
            className="text-gray-400 hover:text-white transition-colors"
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
                className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:border-gray-500 transition-all"
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
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Iniciar Sesión
                </motion.button>
              </Link>
              <Link href="/register">
                <motion.button
                  className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all"
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
