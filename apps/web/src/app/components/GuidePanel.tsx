'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle2, ChevronRight, HelpCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';

type GuideCounts = {
  channels: number;
  ideas: number;
  scripts: number;
  seo: number;
  published: number;
};

const AUTH_ROUTES = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/resend-verification',
]);

const PAGE_TIPS: Record<string, { title: string; description: string }> = {
  '/ai': {
    title: 'AI Studio',
    description: 'Elegis un perfil, completas el input y generas contenido aplicado en la base.',
  },
  '/ideas': {
    title: 'Ideas',
    description: 'Pulí las ideas y marcá las listas para pasar a guion.',
  },
  '/scripts': {
    title: 'Guiones',
    description: 'Revisá hook, estructura y duracion. Ajustá el status cuando este listo.',
  },
  '/seo': {
    title: 'SEO',
    description: 'Definí titulo, descripcion y tags finales para publicar.',
  },
  '/thumbnails': {
    title: 'Miniaturas',
    description: 'Definí texto y estado de diseño antes de publicar.',
  },
  '/channels': {
    title: 'Canales',
    description: 'Conectá tu canal y validá que todo quede asociado.',
  },
  '/': {
    title: 'Dashboard',
    description: 'Desde aca mueves el contenido por el pipeline y publicas.',
  },
  '/start': {
    title: 'Guia',
    description: 'Tenes el flujo recomendado con atajos directos.',
  },
};

const PAGE_STEPS: Record<string, { title: string; items: string[] }> = {
  '/ai': {
    title: 'AI Studio paso a paso',
    items: [
      'Elegí canal y perfil.',
      'Completá el input requerido.',
      'Usá “Generar y aplicar” y revisá el resultado.',
    ],
  },
  '/ideas': {
    title: 'Ideas paso a paso',
    items: [
      'Revisá ideas draft y editá si hace falta.',
      'Aprobá las ideas listas.',
      'Pasá una idea a guion en AI Studio.',
    ],
  },
  '/scripts': {
    title: 'Guiones paso a paso',
    items: [
      'Abrí un guion y revisá hook + cuerpo.',
      'Ajustá el status cuando este listo.',
      'Continuá con SEO y miniaturas.',
    ],
  },
  '/seo': {
    title: 'SEO paso a paso',
    items: [
      'Elegí el mejor titulo.',
      'Revisá descripcion y tags.',
      'Marcá listo antes de publicar.',
    ],
  },
  '/thumbnails': {
    title: 'Miniaturas paso a paso',
    items: [
      'Definí texto de miniatura.',
      'Subí/pegá URL si la tenes.',
      'Marcá como aprobada para publicar.',
    ],
  },
  '/channels': {
    title: 'Canales paso a paso',
    items: [
      'Creá o conectá tu canal.',
      'Verificá nombre y datos.',
      'Volvé a AI Studio para generar ideas.',
    ],
  },
  '/': {
    title: 'Dashboard paso a paso',
    items: [
      'Elegí el canal activo.',
      'Revisá pipeline y backlog.',
      'Publicá cuando el video este listo.',
    ],
  },
  '/start': {
    title: 'Guia paso a paso',
    items: [
      'Conecta canal y valida datos.',
      'Genera ideas y aprueba.',
      'Crea guion, SEO y publica.',
    ],
  },
};

export default function GuidePanel() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const authFetch = useAuthFetch();
  const [counts, setCounts] = useState<GuideCounts>({
    channels: 0,
    ideas: 0,
    scripts: 0,
    seo: 0,
    published: 0,
  });
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState('');
  const [hasStoredPreference, setHasStoredPreference] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined'
      ? window.localStorage.getItem('cronostudio.guide.collapsed')
      : null;
    if (stored !== null) {
      setCollapsed(stored === 'true');
      setHasStoredPreference(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasStoredPreference) return;
    const handleResize = () => {
      const shouldCollapse = window.innerWidth < 1024;
      setCollapsed(shouldCollapse);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasStoredPreference]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedChannel = window.localStorage.getItem('cronostudio.channelId') || '';
    setActiveChannelId(storedChannel);
  }, [pathname]);

  useEffect(() => {
    if (!isAuthenticated || AUTH_ROUTES.has(pathname)) return;
    if (typeof window === 'undefined') return;
    const key = `cronostudio.guide.tour_seen.${pathname}`;
    const seen = window.localStorage.getItem(key);
    if (!seen) {
      setShowSteps(true);
    }
  }, [isAuthenticated, pathname]);

  const fetchCounts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const channelParam = activeChannelId ? `?channelId=${activeChannelId}` : '';
      const publishedParam = activeChannelId ? `?status=published&channelId=${activeChannelId}` : '?status=published';
      const [channelsRes, ideasRes, scriptsRes, seoRes, publishedRes] = await Promise.all([
        authFetch('/api/channels', { signal }),
        authFetch(`/api/ideas${channelParam}`, { signal }),
        authFetch(`/api/scripts${channelParam}`, { signal }),
        authFetch(`/api/seo${channelParam}`, { signal }),
        authFetch(`/api/productions${publishedParam}`, { signal }),
      ]);

      const channels = channelsRes.ok ? await channelsRes.json() : [];
      const ideas = ideasRes.ok ? await ideasRes.json() : [];
      const scripts = scriptsRes.ok ? await scriptsRes.json() : [];
      const seo = seoRes.ok ? await seoRes.json() : [];
      const published = publishedRes.ok ? await publishedRes.json() : [];

      setCounts({
        channels: Array.isArray(channels) ? channels.length : 0,
        ideas: Array.isArray(ideas) ? ideas.length : 0,
        scripts: Array.isArray(scripts) ? scripts.length : 0,
        seo: Array.isArray(seo) ? seo.length : 0,
        published: Array.isArray(published) ? published.length : 0,
      });
    } catch {
      setCounts({ channels: 0, ideas: 0, scripts: 0, seo: 0, published: 0 });
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!isAuthenticated || AUTH_ROUTES.has(pathname)) return;
    const controller = new AbortController();
    fetchCounts(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated, pathname, fetchCounts]);

  const steps = useMemo(() => {
    return [
      {
        key: 'channel',
        title: 'Conecta tu canal',
        description: 'Crea o conecta tu canal para iniciar el flujo.',
        complete: counts.channels > 0,
        href: '/channels',
        actionLabel: 'Ir a canales',
      },
      {
        key: 'ideas',
        title: 'Genera ideas',
        description: 'Usa AI Studio para generar ideas evergreen.',
        complete: counts.ideas > 0,
        href: '/ai',
        actionLabel: 'Ir a AI Studio',
      },
      {
        key: 'scripts',
        title: 'Crea el guion',
        description: 'Transforma una idea en un guion listo para grabar.',
        complete: counts.scripts > 0,
        href: '/ai',
        actionLabel: 'Crear guion',
      },
      {
        key: 'seo',
        title: 'Optimiza SEO',
        description: 'Genera titulos, miniaturas y tags con AI.',
        complete: counts.seo > 0,
        href: '/ai',
        actionLabel: 'Optimizar SEO',
      },
      {
        key: 'publish',
        title: 'Publica el video',
        description: 'Marca publicado cuando el video ya esta en YouTube.',
        complete: counts.published > 0,
        href: '/',
        actionLabel: 'Ir al dashboard',
      },
    ];
  }, [counts]);

  const completedCount = steps.filter((step) => step.complete).length;
  const progress = Math.round((completedCount / steps.length) * 100);
  const currentStep = steps.find((step) => !step.complete) ?? steps[steps.length - 1];
  const tip = PAGE_TIPS[pathname] ?? null;
  const sectionSteps = PAGE_STEPS[pathname] ?? null;

  if (!isAuthenticated || AUTH_ROUTES.has(pathname)) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[65] flex flex-col items-end gap-3">
      {collapsed ? (
        <button
          type="button"
          onClick={() => {
            setCollapsed(false);
            window.localStorage.setItem('cronostudio.guide.collapsed', 'false');
          }}
          className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gray-950/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-300 shadow-lg"
        >
          <HelpCircle className="h-4 w-4" />
          Guia
        </button>
      ) : (
        <div className="w-[min(92vw,360px)] rounded-2xl border border-gray-800 bg-gray-950/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-yellow-400/90">Modo guia</div>
              <h3 className="mt-1 text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                Proximo paso recomendado
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setCollapsed(true);
                window.localStorage.setItem('cronostudio.guide.collapsed', 'true');
              }}
              className="text-xs text-slate-400 hover:text-yellow-300"
            >
              Minimizar
            </button>
          </div>

          <div className="mt-3 rounded-xl border border-gray-800 bg-gray-900/40 p-3">
            <p className="text-sm font-semibold text-slate-100">{currentStep.title}</p>
            <p className="text-xs text-slate-400 mt-1">{currentStep.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Progreso {progress}%</span>
              <Link
                href={currentStep.href}
                className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-300"
              >
                {currentStep.actionLabel}
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-gray-800">
              <div className="h-1.5 rounded-full bg-yellow-400" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {steps.map((step) => (
              <div
                key={step.key}
                className="flex items-start gap-2 rounded-lg border border-gray-800 bg-gray-900/30 px-3 py-2"
              >
                <CheckCircle2 className={`h-4 w-4 ${step.complete ? 'text-emerald-400' : 'text-slate-600'}`} />
                <div className="flex-1">
                  <p className={`text-xs font-semibold ${step.complete ? 'text-emerald-200' : 'text-slate-200'}`}>
                    {step.title}
                  </p>
                  <p className="text-[11px] text-slate-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {tip && (
            <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900/40 p-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-yellow-400/90">En esta seccion</div>
              <p className="mt-1 text-sm font-semibold text-white">{tip.title}</p>
              <p className="text-xs text-slate-400 mt-1">{tip.description}</p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => fetchCounts()}
              className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-yellow-300"
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Actualizando...' : 'Actualizar guia'}
            </button>
            <div className="flex items-center gap-2">
              {sectionSteps && (
                <button
                  type="button"
                  onClick={() => setShowSteps(true)}
                  className="text-[10px] uppercase tracking-[0.2em] text-yellow-300"
                >
                  Guíame
                </button>
              )}
              <span className="text-[10px] text-slate-500">{completedCount}/{steps.length} completados</span>
            </div>
          </div>
        </div>
      )}

      {showSteps && sectionSteps && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
          <div className="w-[min(92vw,420px)] rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-400/90">Guía rápida</div>
                <h4 className="mt-1 text-lg font-semibold text-white">{sectionSteps.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSteps(false);
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem(`cronostudio.guide.tour_seen.${pathname}`, 'true');
                  }
                }}
                className="text-xs text-slate-400 hover:text-yellow-300"
              >
                Cerrar
              </button>
            </div>
            <ol className="mt-4 space-y-2">
              {sectionSteps.items.map((item, index) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-200">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-700 text-[10px] text-yellow-300">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowSteps(false);
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem(`cronostudio.guide.tour_seen.${pathname}`, 'true');
                  }
                }}
                className="text-xs text-slate-400"
              >
                Entendido
              </button>
              <Link
                href={currentStep.href}
                className="inline-flex items-center gap-1 rounded-md bg-yellow-400 px-3 py-2 text-xs font-semibold text-black"
              >
                Ir al paso recomendado
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
