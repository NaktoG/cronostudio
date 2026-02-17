'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Search,
  Settings,
  Tv,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ideas', label: 'Ideas', icon: Lightbulb },
  { href: '/scripts', label: 'Guiones', icon: FileText },
  { href: '/thumbnails', label: 'Miniaturas', icon: ImageIcon },
  { href: '/seo', label: 'SEO', icon: Search },
  { href: '/channels', label: 'Canales', icon: Tv },
  { href: '/analytics', label: 'Analítica', icon: BarChart3 },
];

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header
      className="sticky top-0 z-50 bg-black/85 backdrop-blur-xl border-b border-yellow-500/20"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(246, 201, 69, 0.9), rgba(246, 201, 69, 0.6))',
                boxShadow: '0 10px 24px rgba(246, 201, 69, 0.3)',
              }}
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
                  className="px-4 py-2 text-sm text-slate-300 hover:text-yellow-400 border border-gray-700 rounded-lg hover:border-yellow-500/50 transition-all flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-4 h-4" />
                  Salir
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <motion.button
                    className="px-4 py-2 text-sm text-slate-300 hover:text-yellow-400 transition-colors"
                    whileHover={{ scale: 1.02 }}
                  >
                    Iniciar Sesión
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
                    Registrarse
                  </motion.button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              className="lg:hidden p-2.5 text-slate-300 hover:text-yellow-400 rounded-lg hover:bg-gray-800/50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
              {isAuthenticated && (
                <Link
                  href="/configuracion"
                  className="mb-4 flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-3 text-slate-200"
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
              <div className="grid grid-cols-2 gap-2">
                {NAV_ITEMS.map((item, index) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
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
                            : 'text-slate-300 hover:text-yellow-400 hover:bg-gray-800/50'
                          }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="w-5 h-5" />
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
