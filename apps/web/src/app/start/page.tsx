'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';

const STEPS = [
  {
    title: 'Conecta tu canal',
    description: 'Crea o conecta tu canal para que todo quede asociado.',
    href: '/channels',
    action: 'Ir a canales',
  },
  {
    title: 'Genera ideas',
    description: 'En AI Studio usa evergreen_ideas y genera 10 ideas aplicadas.',
    href: '/ai',
    action: 'Abrir AI Studio',
  },
  {
    title: 'Aprueba ideas',
    description: 'Pulí las ideas y marcá las listas para pasar a guion.',
    href: '/ideas',
    action: 'Ver ideas',
  },
  {
    title: 'Crea el guion',
    description: 'Usa script_architect para generar el guion completo.',
    href: '/ai',
    action: 'Generar guion',
  },
  {
    title: 'Optimiza SEO',
    description: 'Genera titulos, miniaturas y tags con titles_thumbs.',
    href: '/ai',
    action: 'Optimizar SEO',
  },
  {
    title: 'Publica y registra',
    description: 'Marca publicado cuando el video este en YouTube.',
    href: '/',
    action: 'Ir al dashboard',
  },
];

export default function StartPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 w-full">
          <motion.div
            className="mb-8 sm:mb-10"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-yellow-400/90 mb-3">
              <Sparkles className="w-4 h-4" />
              Primeros pasos
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-3">
              Guia para producir contenido
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
              Segui este flujo recomendado para pasar de una idea a un video publicado sin perder el hilo.
            </p>
          </motion.div>

          <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6 items-start">
            <div className="space-y-4">
              {STEPS.map((step, index) => (
                <motion.div
                  key={step.title}
                  className="surface-panel glow-hover p-5 sm:p-6"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-yellow-400/90">
                        Paso {index + 1}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
                      <p className="mt-2 text-sm text-slate-400">{step.description}</p>
                    </div>
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div className="mt-4">
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                    >
                      {step.action}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <BookOpen className="h-5 w-5 text-yellow-300" />
                  Tips rapidos
                </div>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  <li>Usa siempre un canal activo antes de generar.</li>
                  <li>Si una idea no esta lista, ajusta titulo/angulo.</li>
                  <li>En guiones prioriza hook y claridad.</li>
                  <li>SEO: elige un titulo que venda sin clickbait.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Atajo</div>
                <p className="mt-2 text-sm text-slate-300">
                  Podes volver a esta guia desde el menu principal.
                </p>
                <Link
                  href="/ai"
                  className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-yellow-300"
                >
                  Ir directo a AI Studio
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
