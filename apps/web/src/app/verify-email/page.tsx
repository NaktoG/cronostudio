import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">
        Cargando...
      </div>
    }>
      <VerifyEmailClient />
    </Suspense>
  );
}
