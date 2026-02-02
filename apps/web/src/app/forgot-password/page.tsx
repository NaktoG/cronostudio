'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { GuestRoute } from '../components/ProtectedRoute';
import Footer from '../components/Footer';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Ingresa tu email');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al solicitar reset');
      }
      setMessage(data.message || 'Si el email existe, se envio un link');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestRoute>
      <div className="min-h-screen bg-black flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-2xl mb-4 shadow-lg shadow-yellow-400/20"
                whileHover={{ scale: 1.05, rotate: 4 }}
              >
                <Image
                  src="/logo_crono.png"
                  alt="CronoStudio"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                  priority
                />
              </motion.div>
              <h1 className="text-3xl font-bold text-white">Recuperar acceso</h1>
              <p className="text-gray-400 mt-2">Te enviaremos un link para restablecer tu contraseña</p>
            </div>

            <motion.form
              onSubmit={handleSubmit}
              className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-8 space-y-6"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {(error || message) && (
                <div className={`rounded-lg p-3 text-sm ${error ? 'bg-red-500/10 border border-red-500/50 text-red-400' : 'bg-green-500/10 border border-green-500/40 text-green-300'}`}>
                  {error || message}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  placeholder="tu@email.com"
                  disabled={loading}
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? 'Enviando...' : 'Enviar link'}
              </motion.button>

              <div className="text-center text-gray-400 text-sm">
                <Link href="/login" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                  Volver a iniciar sesion
                </Link>
              </div>
            </motion.form>
          </motion.div>
        </div>
        <Footer />
      </div>
    </GuestRoute>
  );
}
