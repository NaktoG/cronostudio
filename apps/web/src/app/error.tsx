'use client';

import { useEffect } from 'react';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-6">
      <div className="max-w-lg w-full rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-yellow-400">Error</p>
        <h1 className="mt-3 text-2xl font-semibold">Algo no salio bien</h1>
        <p className="mt-2 text-sm text-slate-300">
          Se produjo un problema al cargar esta vista. Puedes intentar nuevamente.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-yellow-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
