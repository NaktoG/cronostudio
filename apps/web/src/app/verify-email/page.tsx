"use client";

import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';
import { useLocale } from '../contexts/LocaleContext';
import { getAuthCopy } from '../content/auth';

export default function VerifyEmailPage() {
  const { locale } = useLocale();
  const authCopy = getAuthCopy(locale);

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        {authCopy.verifyEmail.loading}
      </div>
    }>
      <VerifyEmailClient />
    </Suspense>
  );
}
