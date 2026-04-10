'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';

function ContactContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('sent');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold text-white">Contacto</h1>
          <p className="mt-4 text-sm text-slate-300">
            Escribinos para soporte general, dudas o sugerencias. Responderemos en breve.
          </p>

          <form method="POST" action="/api/contact" className="mt-8 rounded-2xl border border-gray-800 bg-gray-950/70 p-6 space-y-4">
            {status === '1' && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
                Gracias, recibimos tu mensaje.
              </div>
            )}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm text-slate-300">Nombre</label>
              <input
                id="name"
                type="text"
                name="name"
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950/60 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
                placeholder="Tu nombre"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm text-slate-300">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950/60 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
                placeholder="tu@email.com"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm text-slate-300">Mensaje</label>
              <textarea
                id="message"
                name="message"
                className="mt-2 w-full min-h-[140px] rounded-lg border border-gray-700 bg-gray-950/60 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
                placeholder="Contanos en que te podemos ayudar"
                required
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-yellow-400 px-5 py-3 text-sm font-semibold text-black"
            >
              Enviar consulta
            </button>
            <p className="text-xs text-slate-500">Responderemos en menos de 24 horas hábiles.</p>
          </form>

          <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Emails directos</p>
            <div className="mt-2 text-sm text-slate-300">
              <p>Soporte: <span className="text-yellow-300">support@atonix.com</span></p>
              <p>Privacidad: <span className="text-yellow-300">privacy@atonix.com</span></p>
              <p>Legal: <span className="text-yellow-300">legal@atonix.com</span></p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex flex-col" />}>
      <ContactContent />
    </Suspense>
  );
}
