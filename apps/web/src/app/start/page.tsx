'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, ChevronRight, Sparkles, Target } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';
import { ONBOARDING_GOALS, ONBOARDING_STORAGE_KEYS } from '@/app/content/onboarding';
import { ONBOARDING_STEPS, OnboardingCounts } from '@/app/content/onboardingSteps';

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  action: string;
  done: boolean;
};


export default function StartPage() {
  const { isAuthenticated } = useAuth();
  const authFetch = useAuthFetch();
  const [activeChannelId, setActiveChannelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [goalKey, setGoalKey] = useState<keyof typeof ONBOARDING_GOALS>('first_publish');
  const [counts, setCounts] = useState<OnboardingCounts>({
    channels: 0,
    ideas: 0,
    ideasApproved: 0,
    scripts: 0,
    scriptsReady: 0,
    seo: 0,
    thumbnailsApproved: 0,
    published: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedChannel = window.localStorage.getItem(ONBOARDING_STORAGE_KEYS.channelId) || '';
    setActiveChannelId(storedChannel);
    const storedGoal = window.localStorage.getItem(ONBOARDING_STORAGE_KEYS.goalKey);
    if (storedGoal === 'first_publish') {
      setGoalKey('first_publish');
      return;
    }
    window.localStorage.setItem(ONBOARDING_STORAGE_KEYS.goalKey, 'first_publish');
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    const fetchCounts = async () => {
      setLoading(true);
      try {
        const channelParam = activeChannelId ? `?channelId=${activeChannelId}` : '';
        const publishedParam = activeChannelId
          ? `?status=published&channelId=${activeChannelId}`
          : '?status=published';
        const [channelsRes, ideasRes, scriptsRes, seoRes, thumbnailsRes, publishedRes] = await Promise.all([
          authFetch('/api/channels', { signal: controller.signal }),
          authFetch(`/api/ideas${channelParam}`, { signal: controller.signal }),
          authFetch(`/api/scripts${channelParam}`, { signal: controller.signal }),
          authFetch(`/api/seo${channelParam}`, { signal: controller.signal }),
          authFetch(`/api/thumbnails?status=approved${activeChannelId ? `&channelId=${activeChannelId}` : ''}`, { signal: controller.signal }),
          authFetch(`/api/productions${publishedParam}`, { signal: controller.signal }),
        ]);

        const channels = channelsRes.ok ? await channelsRes.json() : [];
        const ideas = ideasRes.ok ? await ideasRes.json() : [];
        const scripts = scriptsRes.ok ? await scriptsRes.json() : [];
        const seo = seoRes.ok ? await seoRes.json() : [];
        const thumbnails = thumbnailsRes.ok ? await thumbnailsRes.json() : [];
        const published = publishedRes.ok ? await publishedRes.json() : [];

        const ideasApproved = Array.isArray(ideas)
          ? ideas.filter((idea) => idea.status === 'approved').length
          : 0;
        const scriptsReady = Array.isArray(scripts)
          ? scripts.filter((script) => script.status === 'approved' || script.status === 'recorded').length
          : 0;

        setCounts({
          channels: Array.isArray(channels) ? channels.length : 0,
          ideas: Array.isArray(ideas) ? ideas.length : 0,
          ideasApproved,
          scripts: Array.isArray(scripts) ? scripts.length : 0,
          scriptsReady,
          seo: Array.isArray(seo) ? seo.length : 0,
          thumbnailsApproved: Array.isArray(thumbnails) ? thumbnails.length : 0,
          published: Array.isArray(published) ? published.length : 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
    return () => controller.abort();
  }, [isAuthenticated, authFetch, activeChannelId]);

  const steps: OnboardingStep[] = useMemo(() => {
    return ONBOARDING_STEPS.map((step) => ({
      ...step,
      done: step.isDone(counts),
    }));
  }, [counts]);

  const completed = steps.filter((step) => step.done).length;
  const progress = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;
  const nextStep = steps.find((step) => !step.done) ?? steps[steps.length - 1];
  const goal = ONBOARDING_GOALS[goalKey];

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
              {steps.map((step, index) => (
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
                    <CheckCircle2 className={`h-6 w-6 ${step.done ? 'text-emerald-400' : 'text-gray-700'}`} />
                  </div>
                  <div className="mt-4">
                    <Link
                      href={step.href}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${step.done ? 'bg-gray-800 text-slate-200' : 'bg-yellow-400 text-black'}`}
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
                  <Target className="h-5 w-5 text-yellow-300" />
                  Objetivo actual
                </div>
                <p className="mt-2 text-sm text-slate-300">{goal.title}</p>
                <p className="mt-2 text-xs text-slate-500">{goal.subtitle}</p>
                <div className="mt-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Progreso</div>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-800">
                    <div
                      className="h-2 rounded-full bg-yellow-400"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {loading ? 'Calculando...' : `${completed} / ${steps.length} completados`}
                  </p>
                </div>
                {nextStep && (
                  <div className="mt-4 rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Siguiente paso</div>
                    <p className="mt-2 text-sm text-slate-200">{nextStep.title}</p>
                    <Link
                      href={nextStep.href}
                      className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-yellow-300"
                    >
                      {nextStep.action}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
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
