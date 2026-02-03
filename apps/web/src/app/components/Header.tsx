'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/ideas', label: 'Ideas', icon: '💡' },
  { href: '/scripts', label: 'Guiones', icon: '📝' },
  { href: '/thumbnails', label: 'Miniaturas', icon: '🖼️' },
  { href: '/seo', label: 'SEO', icon: '🔍' },
  { href: '/channels', label: 'Canales', icon: '📺' },
  { href: '/analytics', label: 'Analítica', icon: '📊' },
  { href: '/configuracion', label: 'Configuración', icon: '⚙️' },
];

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header
      className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-yellow-500/20"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              className="w-11 h-11 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/20"
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image
                src="/logo_crono.png"
                alt="CronoStudio"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
                priority
              />
            </motion.div>
            <h1 className="text-2xl font-bold text-white hidden sm:block group-hover:text-yellow-400 transition-colors">
              CronoStudio
            </h1>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-colors ${isActive
                        ? 'bg-yellow-400/10 text-yellow-400'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* User / Auth */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-24 h-10 bg-gray-800 rounded-lg animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-4">
                <motion.div
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-800"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center">
                    <span className="text-yellow-400 font-semibold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <p className="text-base font-medium text-white">{user?.name}</p>
                </motion.div>
                <motion.button
                  onClick={logout}
                  className="px-4 py-2 text-base text-gray-400 hover:text-yellow-400 border border-gray-700 rounded-lg hover:border-yellow-500/50 transition-all"
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
                    className="px-4 py-2 text-base text-gray-300 hover:text-yellow-400 transition-colors"
                    whileHover={{ scale: 1.02 }}
                  >
                    Iniciar Sesión
                  </motion.button>
                </Link>
                <Link href="/register">
                  <motion.button
                    className="px-5 py-2.5 text-base bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 shadow-lg shadow-yellow-400/20"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Registrarse
                  </motion.button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              className="lg:hidden p-2.5 text-gray-400 hover:text-yellow-400 rounded-lg hover:bg-gray-800/50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </motion.button>
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
              <div className="grid grid-cols-2 gap-2">
                {NAV_ITEMS.map((item, index) => {
                  const isActive = pathname === item.href;
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-all text-base ${isActive
                            ? 'bg-yellow-400/10 text-yellow-400'
                            : 'text-gray-400 hover:text-yellow-400 hover:bg-gray-800/50'
                          }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
