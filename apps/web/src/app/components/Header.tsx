'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard' },
  { href: '/ideas', label: '💡 Ideas' },
  { href: '/scripts', label: '📝 Guiones' },
  { href: '/thumbnails', label: '🖼️ Miniaturas' },
  { href: '/seo', label: '🔍 SEO' },
  { href: '/channels', label: 'Canales' },
  { href: '/analytics', label: 'Analytics' },
];

export default function Header() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header
      className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-yellow-500/30"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-400/20">
              <span className="text-black font-bold text-lg">C</span>
            </div>
            <h1 className="text-2xl font-bold text-white hidden sm:block">CronoStudio</h1>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-400 hover:text-yellow-400 transition-colors text-sm"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User / Auth */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-20 h-8 bg-gray-800 rounded animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                </div>
                <motion.button
                  onClick={logout}
                  className="px-3 py-1.5 text-sm text-gray-400 hover:text-yellow-400 border border-gray-700 rounded-lg hover:border-yellow-500/50 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Salir
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <button className="px-3 py-1.5 text-sm text-gray-300 hover:text-yellow-400">
                    Iniciar Sesión
                  </button>
                </Link>
                <Link href="/register">
                  <button className="px-3 py-1.5 text-sm bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300">
                    Registrarse
                  </button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-gray-400 hover:text-yellow-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              className="lg:hidden mt-4 pb-4 border-t border-gray-800 pt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex flex-col gap-2">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-gray-400 hover:text-yellow-400 py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
