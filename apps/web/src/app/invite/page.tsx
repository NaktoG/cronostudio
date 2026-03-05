'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuthFetch } from '../contexts/AuthContext';

export default function InviteAcceptPage() {
  const searchParams = useSearchParams();
  const authFetch = useAuthFetch();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams?.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No encontramos el token de invitacion.');
      return;
    }

    const acceptInvite = async () => {
      setStatus('loading');
      try {
        const response = await authFetch('/api/collaborators/accept', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || 'No pudimos aceptar la invitacion');
        }
        setStatus('success');
        setMessage('Invitacion aceptada. Ya puedes colaborar.');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'No pudimos aceptar la invitacion');
      }
    };

    acceptInvite();
  }, [searchParams, authFetch]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <motion.div
            className="rounded-2xl border border-gray-800 bg-gray-950/70 p-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-xs uppercase tracking-[0.2em] text-yellow-400/90">Invitacion</div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-semibold text-white">Unete al equipo</h1>
            <p className="mt-2 text-sm text-slate-300">Confirmamos tu acceso como colaborador.</p>

            <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/40 p-4 flex items-start gap-3">
              {status === 'success' ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              )}
              <div>
                <p className="text-sm text-slate-200">
                  {status === 'loading' ? 'Aceptando invitacion...' : message}
                </p>
                {status === 'success' && (
                  <p className="text-xs text-slate-400 mt-1">Puedes volver al dashboard y continuar.</p>
                )}
              </div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
