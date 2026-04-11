'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle2, ChevronRight, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';
import { evaluateIdeaReady } from '@/lib/ideaReady';

type GuideCounts = {
  channels: number;
  ideas: number;
  ideasApproved: number;
  scripts: number;
  scriptsReady: number;
  seo: number;
  thumbnailsApproved: number;
  published: number;
};

type IdeaChecklist = {
  total: number;
  ready: number;
  missing: string[];
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
    title: 'Crono',
    description: 'Usa los perfiles para generar ideas, guiones, retencion y titulos con salida aplicada.',
  },
  '/ideas': {
    title: 'Ideas',
    description: 'Refina ideas, aprueba las viables y prepara el paso a guion.',
  },
  '/scripts': {
    title: 'Guiones',
    description: 'Verifica hook, estructura y duracion antes de marcar listo.',
  },
  '/seo': {
    title: 'SEO',
    description: 'Elige el titulo final y asegura descripcion + tags consistentes.',
  },
  '/thumbnails': {
    title: 'Miniaturas',
    description: 'Define texto, variante y estado antes de publicar.',
  },
  '/channels': {
    title: 'Canales',
    description: 'Conecta YouTube y define el canal activo.',
  },
  '/': {
    title: 'Dashboard',
    description: 'Prioriza el flujo semanal y registra publicaciones.',
  },
  '/start': {
    title: 'Guia',
    description: 'Flujo recomendado con checkpoints y atajos.',
  },
};

const PAGE_STEPS: Record<string, { title: string; items: string[] }> = {
  '/ai': {
    title: 'Crono paso a paso',
    items: [
      'Selecciona canal y perfil (Evergreen AI, Script Architect, Retention Editor, Titles & Thumbs).',
      'Completa el brief con contexto real del canal.',
      'Usa “Generar y aplicar” y valida el resultado.',
    ],
  },
  '/ideas': {
    title: 'Ideas paso a paso',
    items: [
      'Revisa ideas draft y ajusta el angulo.',
      'Aprueba las ideas con potencial evergreen.',
      'Enviala a guion desde Crono.',
    ],
  },
  '/scripts': {
    title: 'Guiones paso a paso',
    items: [
      'Revisa hook, promesa y ritmo.',
      'Marca listo cuando el guion este pulido.',
      'Continua con SEO y miniaturas.',
    ],
  },
  '/seo': {
    title: 'SEO paso a paso',
    items: [
      'Elige el titulo final.',
      'Asegura descripcion y tags.',
      'Marca listo antes de publicar.',
    ],
  },
  '/thumbnails': {
    title: 'Miniaturas paso a paso',
    items: [
      'Define texto de miniatura.',
      'Sube o pega la URL final.',
      'Aprueba antes de publicar.',
    ],
  },
  '/channels': {
    title: 'Canales paso a paso',
    items: [
      'Crea o conecta el canal.',
      'Verifica nombre y datos.',
      'Vuelve a Crono para generar ideas.',
    ],
  },
  '/': {
    title: 'Dashboard paso a paso',
    items: [
      'Selecciona canal activo.',
      'Revisa pipeline y backlog.',
      'Publica cuando el video este listo.',
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
    ideasApproved: 0,
    scripts: 0,
    scriptsReady: 0,
    seo: 0,
    thumbnailsApproved: 0,
    published: 0,
  });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState('');
  const [panelRight, setPanelRight] = useState<number | null>(null);
  const [tourSeen, setTourSeen] = useState(false);
  const [ideaChecklist, setIdeaChecklist] = useState<IdeaChecklist>({ total: 0, ready: 0, missing: [] });
  const stepsDialogRef = useRef<HTMLDivElement | null>(null);
  const autoStepsRef = useRef<Record<string, boolean>>({});
  const tip = PAGE_TIPS[pathname] ?? null;
  const sectionSteps = PAGE_STEPS[pathname] ?? null;

  useEffect(() => {
    if (!isAuthenticated || AUTH_ROUTES.has(pathname)) return;
    const stored = typeof window !== 'undefined'
      ? window.localStorage.getItem('cronostudio.guide.open')
      : null;
    if (stored === null) {
      setIsOpen(true);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('cronostudio.guide.open', 'true');
      }
      return;
    }
    setIsOpen(stored === 'true');
  }, [isAuthenticated, pathname]);

  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((current) => {
        const next = !current;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('cronostudio.guide.open', String(next));
        }
        return next;
      });
    };
    window.addEventListener('cronostudio:toggle-guide', handleToggle as EventListener);
    return () => window.removeEventListener('cronostudio:toggle-guide', handleToggle as EventListener);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedChannel = window.localStorage.getItem('cronostudio.channelId') || '';
    setActiveChannelId(storedChannel);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = window.localStorage.getItem(`cronostudio.guide.tour_seen.${pathname}`) === 'true';
    setTourSeen(seen);
  }, [pathname, showSteps]);

  useEffect(() => {
    if (!isAuthenticated || AUTH_ROUTES.has(pathname)) return;
    if (!sectionSteps || tourSeen) return;
    if (autoStepsRef.current[pathname]) return;
    autoStepsRef.current[pathname] = true;
    const timer = window.setTimeout(() => setShowSteps(true), 350);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, pathname, sectionSteps, tourSeen]);

  useEffect(() => {
    if (!showSteps) return;
    const focusable = stepsDialogRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }, [showSteps]);

  const handleStepsKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setShowSteps(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = stepsDialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey) {
      if (active === first) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updatePanelRight = () => {
      if (pathname !== '/ai' || window.innerWidth < 1024) {
        setPanelRight(null);
        return;
      }
      const maxWidth = 1280;
      const extra = Math.max((window.innerWidth - maxWidth) / 2, 24);
      setPanelRight(extra);
    };
    updatePanelRight();
    window.addEventListener('resize', updatePanelRight);
    return () => window.removeEventListener('resize', updatePanelRight);
  }, [pathname]);

  const fetchCounts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const channelParam = activeChannelId ? `?channelId=${activeChannelId}` : '';
      const publishedParam = activeChannelId ? `?status=published&channelId=${activeChannelId}` : '?status=published';
      const [channelsRes, ideasRes, scriptsRes, seoRes, thumbnailsRes, publishedRes] = await Promise.all([
        authFetch('/api/channels', { signal }),
        authFetch(`/api/ideas${channelParam}`, { signal }),
        authFetch(`/api/scripts${channelParam}`, { signal }),
        authFetch(`/api/seo${channelParam}`, { signal }),
        authFetch(`/api/thumbnails?status=approved${activeChannelId ? `&channelId=${activeChannelId}` : ''}`, { signal }),
        authFetch(`/api/productions${publishedParam}`, { signal }),
      ]);

      const channels = channelsRes.ok ? await channelsRes.json() : [];
      const ideas = ideasRes.ok ? await ideasRes.json() : [];
      const scripts = scriptsRes.ok ? await scriptsRes.json() : [];
      const seo = seoRes.ok ? await seoRes.json() : [];
      const thumbnails = thumbnailsRes.ok ? await thumbnailsRes.json() : [];
      const published = publishedRes.ok ? await publishedRes.json() : [];

      let ideasApproved = 0;
      if (Array.isArray(ideas)) {
        const missing = new Set<string>();
        let ready = 0;
        ideas.forEach((idea) => {
          const readiness = evaluateIdeaReady(idea.title, idea.description);
          if (readiness.isReady) {
            ready += 1;
          } else {
            readiness.errors.forEach((error) => missing.add(error));
          }
          if (idea.status === 'approved') {
            ideasApproved += 1;
          }
        });
        setIdeaChecklist({ total: ideas.length, ready, missing: Array.from(missing) });
      } else {
        setIdeaChecklist({ total: 0, ready: 0, missing: [] });
      }

      const scriptsReady = Array.isArray(scripts)
        ? scripts.filter((script) => script.status === 'approved' || script.status === 'recorded').length
        : 0;

      const thumbnailsApproved = Array.isArray(thumbnails) ? thumbnails.length : 0;

      setCounts({
        channels: Array.isArray(channels) ? channels.length : 0,
        ideas: Array.isArray(ideas) ? ideas.length : 0,
        ideasApproved,
        scripts: Array.isArray(scripts) ? scripts.length : 0,
        scriptsReady,
        seo: Array.isArray(seo) ? seo.length : 0,
        thumbnailsApproved,
        published: Array.isArray(published) ? published.length : 0,
      });
    } catch {
      setCounts({ channels: 0, ideas: 0, ideasApproved: 0, scripts: 0, scriptsReady: 0, seo: 0, thumbnailsApproved: 0, published: 0 });
      setIdeaChecklist({ total: 0, ready: 0, missing: [] });
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  }, [authFetch, activeChannelId]);

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
        description: 'Usa Crono para generar ideas evergreen.',
        complete: counts.ideasApproved > 0,
        href: '/ai',
        actionLabel: 'Ir a Crono',
      },
      {
        key: 'scripts',
        title: 'Crea el guion',
        description: 'Transforma una idea en un guion listo para grabar.',
        complete: counts.scriptsReady > 0,
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
  const quickAction = useMemo(() => {
    const map: Record<string, { label: string; href: string }> = {
      channel: { label: 'Crear canal', href: '/channels' },
      ideas: { label: 'Crear idea', href: '/ideas?new=1' },
      scripts: { label: 'Crear guion', href: '/scripts?new=1' },
      seo: { label: 'Abrir SEO', href: '/seo' },
      publish: { label: 'Abrir dashboard', href: '/?new=1' },
    };
    return map[currentStep.key] ?? null;
  }, [currentStep.key]);
  

  if (!isAuthenticated || AUTH_ROUTES.has(pathname)) return null;
  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+88px)] right-6 z-[65] flex flex-col items-end gap-3 lg:bottom-6"
      style={panelRight ? { right: `${panelRight}px` } : undefined}
    >
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
              setIsOpen(false);
              window.localStorage.setItem('cronostudio.guide.open', 'false');
            }}
            className="text-xs text-slate-400 hover:text-yellow-300"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-3 rounded-xl border border-gray-800 bg-gray-900/40 p-3">
          <p className="text-sm font-semibold text-slate-100">{currentStep.title}</p>
          <p className="text-xs text-slate-400 mt-1">{currentStep.description}</p>
          {currentStep.key === 'ideas' && ideaChecklist.total > 0 && counts.ideasApproved === 0 && ideaChecklist.ready > 0 && (
            <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
              Tenes {ideaChecklist.ready} ideas listas para aprobar.
              <Link href="/ideas" className="mt-1 inline-flex items-center text-[11px] font-semibold text-emerald-200">
                Aprobar ahora
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          )}
          {currentStep.key === 'ideas' && ideaChecklist.total > 0 && ideaChecklist.ready === 0 && ideaChecklist.missing.length > 0 && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              <div className="font-semibold">Checklist para aprobar</div>
              <ul className="mt-1 list-disc pl-4 space-y-0.5">
                {ideaChecklist.missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link href="/ideas" className="mt-2 inline-flex items-center text-[11px] font-semibold text-yellow-300">
                Ir a Ideas
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          )}
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
          {quickAction && (
            <div className="mt-3">
              <Link
                href={quickAction.href}
                className="inline-flex items-center gap-1 rounded-md border border-yellow-400/40 px-3 py-2 text-[11px] font-semibold text-yellow-200 hover:border-yellow-400 hover:text-yellow-100"
              >
                {quickAction.label}
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          )}
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-800">
            <div className="h-1.5 rounded-full bg-yellow-400" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {showFull && (
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
        )}

        {showFull && tip && (
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
            <button
              type="button"
              onClick={() => setShowFull((current) => !current)}
              className="text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-yellow-300"
            >
              {showFull ? 'Ver menos' : 'Ver todo'}
            </button>
            {sectionSteps && (
              <button
                type="button"
                onClick={() => setShowSteps(true)}
                className="text-[10px] uppercase tracking-[0.2em] text-yellow-300"
              >
                {tourSeen ? 'Repetir' : 'Guíame'}
              </button>
            )}
            <span className="text-[10px] text-slate-500">{completedCount}/{steps.length} completados</span>
          </div>
        </div>
      </div>

        {showSteps && sectionSteps && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="guide-steps-title"
              className="w-[min(92vw,420px)] rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-xl"
              ref={stepsDialogRef}
              onKeyDown={handleStepsKeyDown}
            >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-400/90">Guía rápida</div>
                <h4 id="guide-steps-title" className="mt-1 text-lg font-semibold text-white">{sectionSteps.title}</h4>
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
