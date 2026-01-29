'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GuestRoute } from '../components/ProtectedRoute';
import Footer from '../components/Footer';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token inválido');
      return;
    }

    let mounted = true;
    setStatus('loading');
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!mounted) return;
        if (!res.ok) throw new Error(data.error || 'Error al verificar');
        setStatus('success');
        setMessage(data.message || 'Email verificado');
      })
      .catch((err) => {
        if (!mounted) return;
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Error desconocido');
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <GuestRoute>
      <div className="min-h-screen bg-black flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            className="w-full max-w-md text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-2xl mb-4 shadow-lg shadow-yellow-400/20"
              whileHover={{ scale: 1.05, rotate: 4 }}
            >
              <img
                src="/logo_crono.png"
                alt="CronoStudio"
                className="w-10 h-10 object-contain"
              />
            </motion.div>
            <h1 className="text-3xl font-bold text-white">Verificacion de email</h1>
            <p className="text-gray-400 mt-2">Estamos procesando tu solicitud</p>

            <div className="mt-6 bg-gray-900/50 border border-yellow-500/20 rounded-2xl p-6">
              {status === 'loading' && (
                <div className="text-gray-300">Verificando...</div>
              )}
              {status === 'success' && (
                <div className="text-green-300">{message}</div>
              )}
              {status === 'error' && (
                <div className="text-red-400">{message}</div>
              )}
            </div>

            <div className="mt-6 text-sm text-gray-400">
              <Link href="/login" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                Ir a login
              </Link>
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    </GuestRoute>
  );
}
