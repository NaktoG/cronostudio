"use client";

import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';
import { useLocale } from '../contexts/LocaleContext';
import { getAuthCopy } from '../content/auth';

export default function ResetPasswordPage() {
  const { locale } = useLocale();
  const copy = getAuthCopy(locale);

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        {copy.verifyEmail.loading}
      </div>
    }>
      <ResetPasswordClient />
    </Suspense>
  );
}
