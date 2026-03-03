'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { HelpCircle, LogOut, Menu, Settings, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NAV_ITEMS, NAV_LABELS } from '../content/navigation';

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileMenuOpen]);

  return (
    <motion.header
      className="sticky top-0 z-50 bg-black/85 backdrop-blur-xl border-b border-yellow-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full px-4 md:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(246, 201, 69, 0.9), rgba(246, 201, 69, 0.6))',
                boxShadow: '0 10px 24px rgba(246, 201, 69, 0.3)',
              }}
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image
                src="/Logo_Crono_02.png"
                alt="CronoStudio"
                width={32}
                height={32}
                className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                priority
              />
            </motion.div>
            <h1 className="text-2xl font-semibold text-white hidden sm:block group-hover:text-yellow-400 transition-colors">
              CronoStudio
            </h1>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                        ? 'bg-yellow-400/10 text-yellow-400'
                        : 'text-slate-300 hover:text-white hover:bg-gray-800/50'
                      }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* User / Auth */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="w-24 h-10 bg-gray-800 rounded-lg animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-4">
                <motion.button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('cronostudio:toggle-guide'))}
                  className="hidden sm:inline-flex px-3 py-2 text-sm text-slate-300 hover:text-yellow-400 border border-gray-700 rounded-lg hover:border-yellow-500/50 transition-all items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <HelpCircle className="w-4 h-4" />
                  Guía
                </motion.button>
                <Link href="/configuracion" className="hidden sm:block">
                  <motion.div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-800 hover:border-yellow-500/50 transition-all"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center">
                      <span className="text-yellow-400 font-semibold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <p className="text-base font-medium text-white">{user?.name}</p>
                    <Settings className="w-4 h-4 text-slate-400" />
                  </motion.div>
                </Link>
                <motion.button
                  onClick={logout}
                  className="hidden sm:inline-flex px-4 py-2 text-sm text-slate-300 hover:text-yellow-400 border border-gray-700 rounded-lg hover:border-yellow-500/50 transition-all items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-4 h-4" />
                  {NAV_LABELS.logout}
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <motion.button
                    className="px-4 py-2 text-sm text-slate-300 hover:text-yellow-400 transition-colors"
                    whileHover={{ scale: 1.02 }}
                  >
                    {NAV_LABELS.login}
                  </motion.button>
                </Link>
                <Link href="/register">
                  <motion.button
                    className="px-5 py-2.5 text-sm text-black font-semibold rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(246, 201, 69, 0.95), rgba(246, 201, 69, 0.7))',
                      boxShadow: '0 8px 18px rgba(246, 201, 69, 0.22)',
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {NAV_LABELS.register}
                  </motion.button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              className="lg:hidden p-2.5 text-slate-300 hover:text-yellow-400 rounded-lg hover:bg-gray-800/50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {mounted && createPortal(
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                className="fixed inset-0 z-[60] lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="absolute inset-0 bg-black/70" onClick={() => setMobileMenuOpen(false)} />
                <motion.div
                  className="absolute right-0 top-0 h-full w-[min(90vw,320px)] border-l border-gray-800 bg-gray-950 px-5 py-6 pb-[env(safe-area-inset-bottom)]"
                  initial={{ x: reduceMotion ? 0 : 80, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: reduceMotion ? 0 : 80, opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/90">Menú</span>
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Cerrar menú"
                      className="text-slate-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {isAuthenticated && (
                    <Link
                      href="/configuracion"
                      className="mt-5 flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-3 text-slate-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="w-9 h-9 rounded-full bg-yellow-400/20 flex items-center justify-center">
                        <span className="text-yellow-400 font-semibold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{user?.name}</p>
                        <p className="text-xs text-slate-400">Mi cuenta</p>
                      </div>
                      <Settings className="w-4 h-4 text-slate-400" />
                    </Link>
                  )}
                  <div className="mt-5 flex flex-col gap-2">
                    {isAuthenticated && (
                      <button
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('cronostudio:toggle-guide'));
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm text-slate-300 hover:text-yellow-400 hover:bg-gray-800/50"
                      >
                        <HelpCircle className="w-5 h-5" />
                        <span className="font-medium">Guía</span>
                      </button>
                    )}
                    {NAV_ITEMS.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm ${isActive
                              ? 'bg-yellow-400/10 text-yellow-400'
                              : 'text-slate-300 hover:text-yellow-400 hover:bg-gray-800/50'
                            }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-800 text-slate-200 hover:text-yellow-400 hover:border-yellow-500/40"
                    >
                      <LogOut className="w-4 h-4" />
                      {NAV_LABELS.logout}
                    </button>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </motion.header>
  );
}
