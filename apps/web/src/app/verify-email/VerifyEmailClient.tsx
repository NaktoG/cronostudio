'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { GuestRoute } from '../components/ProtectedRoute';
import Footer from '../components/Footer';
import { useLocale } from '../contexts/LocaleContext';
import { getAuthCopy } from '../content/auth';

export default function VerifyEmailClient() {
  const { locale } = useLocale();
  const authCopy = getAuthCopy(locale);
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const initialStatus: 'loading' | 'error' = token ? 'loading' : 'error';
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(initialStatus);
  const [message, setMessage] = useState(token ? '' : authCopy.verifyEmail.invalidToken);

  useEffect(() => {
    if (!token) {
      return;
    }

    let mounted = true;
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!mounted) return;
        if (!res.ok) throw new Error(data.error || authCopy.verifyEmail.requestFailed);
        setStatus('success');
        setMessage(data.message || authCopy.verifyEmail.successFallback);
      })
      .catch((err) => {
        if (!mounted) return;
        setStatus('error');
        setMessage(err instanceof Error ? err.message : authCopy.common.unknownError);
      });

    return () => {
      mounted = false;
    };
  }, [token, authCopy.verifyEmail.requestFailed, authCopy.verifyEmail.successFallback, authCopy.common.unknownError]);

  return (
    <GuestRoute>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            className="w-full max-w-md text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 sm:w-[88px] sm:h-[88px] bg-yellow-400 rounded-[22px] sm:rounded-[24px] mb-4 shadow-[0_0_30px_rgba(246,201,69,0.25)] ring-2 ring-black/50"
              whileHover={{ scale: 1.05, rotate: 4 }}
            >
                <Image
                  src="/crono-mark-dark.svg"
                  alt="CronoStudio"
                width={72}
                height={72}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                priority
              />
            </motion.div>
            <h1 className="text-3xl font-bold text-white">{authCopy.verifyEmail.title}</h1>
            <p className="text-gray-400 mt-2">{authCopy.verifyEmail.subtitle}</p>

            <div className="mt-6 bg-gray-900/50 border border-yellow-500/20 rounded-2xl p-6">
              {status === 'loading' && (
                <div className="text-gray-300">{authCopy.verifyEmail.loading}</div>
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
                {authCopy.verifyEmail.backToLogin}
              </Link>
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    </GuestRoute>
  );
}
