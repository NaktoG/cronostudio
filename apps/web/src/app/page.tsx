'use client';

import { Suspense, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Instagram, Linkedin, Music2, Plus, Sparkles, Twitter, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDate, formatDateTime, formatMonthYear, getIsoWeekInfo } from '@/lib/dates';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { PageTransition } from './components/Animations';
import PriorityActions from './components/PriorityActions';
import ProductionPipeline from './components/ProductionPipeline';
import ProductionsList, { Production } from './components/ProductionsList';
import AutomationRuns, { AutomationRun } from './components/AutomationRuns';
import { useAuth, useAuthFetch } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import { DASHBOARD_COPY, STAGE_LABELS } from './content/dashboard';
import useDialogFocus from './hooks/useDialogFocus';

interface PipelineStats {
  idea: number;
  scripting: number;
  recording: number;
  editing: number;
  shorts: number;
  publishing: number;
  published: number;
}

interface PriorityAction {
  id: string;
  type: 'idea' | 'script' | 'seo' | 'thumbnail' | 'short' | 'publish';
  title: string;
  productionTitle: string;
  productionId: string;
  urgency: 'high' | 'medium' | 'low';
  href?: string;
}

interface WeeklyStatus {
  status: 'OK' | 'EN_RIESGO' | 'FALLIDA';
  nextCondition: { label: string; dueAt: string; missing: string[] } | null;
  channel: { id: string; name: string } | null;
  channelSource: 'explicit' | 'default';
  goal: { targetVideos: number; diasPublicacion: string[]; horaCorte: string };
  week: { isoYear: number; isoWeek: number; startDate: string; endDate: string };
  publishedCount: number;
  publishedThisWeek?: { id: string; title: string; publishedAt: string }[];
  planGenerated?: boolean;
  plannedProductions?: { id: string; title: string; day: string | null; status: string }[];
  currentStreak?: number;
  bestStreak?: number;
  last4Weeks?: { isoYear: number; isoWeek: number; status: 'OK' | 'EN_RIESGO' | 'FALLIDA' }[];
  tasks: PriorityAction[];
}

interface DisciplineWeekly {
  status: 'OK' | 'EN_RIESGO' | 'FALLIDA' | 'CUMPLIDA';
  channel: { id: string; name: string; source: 'explicit' | 'default' };
  week: { isoYear: number; isoWeek: number; startDate: string; endDate: string; weekKey: string };
  scoreboard: { count: number; target: number };
  deadlines: { tuesday: string | null; friday: string | null };
  streak: { current: number; best: number };
}

interface YoutubeReconcileWeekly {
  isoYear: number;
  isoWeek: number;
  youtubeChannelId: string | null;
  internalChannelId: string | null;
  expectedSlots: Array<{ key: 'tue' | 'fri'; date: string | null; windowStart: string | null; windowEnd: string | null }>;
  youtubeEvidence: Record<'tue' | 'fri', { matched: boolean; video: { videoId: string; title: string; publishedAt: string; url: string } | null }>;
  publishEvents: Record<'tue' | 'fri', { matched: boolean; eventId: string | null; publishedAt: string | null }>;
  reconciliation: Record<'tue' | 'fri', 'ok' | 'missing_publish_event' | 'missing_youtube_video' | 'mismatch'>;
  suggestedActions: Array<{ type: string; slot: 'tue' | 'fri'; payload: Record<string, unknown> }>;
}

type DashboardTab = 'production' | 'calendar' | 'backlog' | 'integrations';

interface WeeklyGoalResponse {
  goal: { targetVideos: number; diasPublicacion: string[]; horaCorte: string };
  channel: { id: string; name: string } | null;
  channelSource: 'explicit' | 'default';
  isoYear: number;
  isoWeek: number;
  source: 'stored' | 'default';
}

interface Channel {
  id: string;
  name: string;
}

function generatePriorityActions(productions: Production[]): PriorityAction[] {
  const actions: PriorityAction[] = [];
  for (const prod of productions) {
    if (prod.status === 'scripting' && (!prod.script_status || prod.script_status === 'draft')) {
      actions.push({ id: prod.id, type: 'script', title: DASHBOARD_COPY.priorityActions.script, productionTitle: prod.title, productionId: prod.id, urgency: 'high' });
    }
    if ((prod.status === 'editing' || prod.status === 'shorts') && (!prod.thumbnail_status || prod.thumbnail_status === 'pending')) {
      actions.push({ id: `${prod.id}-thumb`, type: 'thumbnail', title: DASHBOARD_COPY.priorityActions.thumbnail, productionTitle: prod.title, productionId: prod.id, urgency: 'medium' });
    }
    if ((prod.status === 'editing' || prod.status === 'publishing') && (!prod.seo_score || prod.seo_score < 60)) {
      actions.push({ id: `${prod.id}-seo`, type: 'seo', title: DASHBOARD_COPY.priorityActions.seo, productionTitle: prod.title, productionId: prod.id, urgency: 'medium' });
    }
    if (prod.status === 'shorts' && prod.shorts_count === 0) {
      actions.push({ id: `${prod.id}-short`, type: 'short', title: DASHBOARD_COPY.priorityActions.shorts, productionTitle: prod.title, productionId: prod.id, urgency: 'low' });
    }
  }
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  return actions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]).slice(0, 5);
}

const TOUR_STEPS = [
  { id: 'week-stepper', title: 'Esta semana', description: 'Revisa Mar/Vie y el estado real del canal.' },
  { id: 'action-dock', title: 'Acciones rápidas', description: 'Registra, planifica o verifica YouTube en 1 clic.' },
  { id: 'pipeline', title: 'Producción', description: 'Avanza por etapas sin perder el foco.' },
  { id: 'calendar', title: 'Calendario', description: 'Programa contenido y ajusta fechas.' },
  { id: 'integrations', title: 'Integraciones', description: 'Conecta canales y valida datos externos.' },
];


function getChecklistStatus(production: Production) {
  const scriptReady = production.script_status && production.script_status !== 'draft';
  const seoReady = typeof production.seo_score === 'number' && production.seo_score >= 60;
  const thumbnailReady = production.thumbnail_status === 'approved';
  const published = production.status === 'published';

  return {
    scriptReady,
    seoReady,
    thumbnailReady,
    published,
  };
}

function OnboardingTour({
  open,
  stepIndex,
  onClose,
  onNext,
  onBack,
  reduceMotion,
}: {
  open: boolean;
  stepIndex: number;
  onClose: () => void;
  onNext: () => void;
  onBack: () => void;
  reduceMotion: boolean;
}) {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const step = TOUR_STEPS[stepIndex];

  useEffect(() => {
    if (!open || !step) return;
    const anchor = document.querySelector(`[data-tour="${step.id}"]`);
    if (anchor) {
      setAnchorRect(anchor.getBoundingClientRect());
    } else {
      setAnchorRect(null);
    }
  }, [open, stepIndex, step]);

  useEffect(() => {
    if (!open) return;
    const handleResize = () => {
      const anchor = step ? document.querySelector(`[data-tour="${step.id}"]`) : null;
      if (anchor) {
        setAnchorRect(anchor.getBoundingClientRect());
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [open, step]);

  if (!open || !step) return null;

  const highlightStyle = anchorRect
    ? {
        top: anchorRect.top + window.scrollY - 6,
        left: anchorRect.left + window.scrollX - 6,
        width: anchorRect.width + 12,
        height: anchorRect.height + 12,
      }
    : null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      {highlightStyle && (
        <div
          className="absolute rounded-xl border border-yellow-400/70 shadow-[0_0_0_4px_rgba(250,204,21,0.15)]"
          style={highlightStyle}
        />
      )}
      <div
        className={`absolute w-[min(90vw,360px)] rounded-xl border border-gray-800 bg-gray-950/95 p-4 text-white shadow-xl ${reduceMotion ? '' : 'transition-all duration-300'}`}
        style={
          anchorRect
            ? {
                top: anchorRect.bottom + window.scrollY + 12,
                left: Math.min(anchorRect.left + window.scrollX, window.innerWidth - 380),
              }
            : { top: '20%', left: '50%', transform: 'translateX(-50%)' }
        }
      >
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-300">Guía rápida</div>
        <h4 className="mt-2 text-lg font-semibold">{step.title}</h4>
        <p className="mt-2 text-sm text-slate-300">{step.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={stepIndex === 0}
            className="text-xs text-slate-400 disabled:opacity-40"
          >
            Atrás
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="text-xs text-slate-400">
              Cerrar
            </button>
            <button
              type="button"
              onClick={onNext}
              className="rounded-md bg-yellow-400 px-3 py-1 text-xs font-semibold text-black"
            >
              {stepIndex === TOUR_STEPS.length - 1 ? 'Finalizar' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { isAuthenticated } = useAuth();
  const authFetch = useAuthFetch();
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [productions, setProductions] = useState<Production[]>([]);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats>({
    idea: 0, scripting: 0, recording: 0, editing: 0, shorts: 0, publishing: 0, published: 0
  });
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyStatus, setWeeklyStatus] = useState<WeeklyStatus | null>(null);
  const [disciplineWeekly, setDisciplineWeekly] = useState<DisciplineWeekly | null>(null);
  const [reconcileWeekly, setReconcileWeekly] = useState<YoutubeReconcileWeekly | null>(null);
  const [weeklyActions, setWeeklyActions] = useState<PriorityAction[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoalResponse | null>(null);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [publishTarget, setPublishTarget] = useState<Production | null>(null);
  const [publishUrl, setPublishUrl] = useState('');
  const [publishPlatformId, setPublishPlatformId] = useState('');
  const [publishPlatformTouched, setPublishPlatformTouched] = useState(false);
  const [focusedProductionId, setFocusedProductionId] = useState<string | null>(null);
  const [publishSubmitting, setPublishSubmitting] = useState(false);
  const [quickPublishSubmitting, setQuickPublishSubmitting] = useState(false);
  const [reconcileSubmitting, setReconcileSubmitting] = useState(false);
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [ideas, setIdeas] = useState<{ id: string; title: string; status: string; priority: number }[]>([]);
  const [activeStage, setActiveStage] = useState<keyof PipelineStats | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('production');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [scheduleProductionId, setScheduleProductionId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const publishRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const fallbackIso = useMemo(() => getIsoWeekInfo(new Date()), []);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSlot, setDrawerSlot] = useState<'tue' | 'fri' | null>(null);
  const [focusOpen, setFocusOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showStartCard, setShowStartCard] = useState(false);

  useDialogFocus(modalRef, showModal);
  useDialogFocus(publishRef, Boolean(publishTarget));

  useEffect(() => {
    if (!isAuthenticated) return;
    const paramChannel = searchParams?.get('channelId');
    const storedChannel = typeof window !== 'undefined' ? window.localStorage.getItem('cronostudio.channelId') : null;
    const initial = paramChannel || storedChannel || '';
    if (initial) {
      setSelectedChannelId(initial);
    }
  }, [isAuthenticated, searchParams]);

  useEffect(() => {
    if (!drawerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  const fetchChannels = useCallback(async (signal?: AbortSignal) => {
    try {
      if (!isAuthenticated) {
        setChannels([]);
        return;
      }
      const response = await authFetch('/api/channels', { signal });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        setChannels(list);
        if (!selectedChannelId && list.length > 0) {
          const defaultId = list[0].id;
          setSelectedChannelId(defaultId);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('cronostudio.channelId', defaultId);
          }
          const params = new URLSearchParams(searchParams?.toString() ?? '');
          params.set('channelId', defaultId);
          const query = params.toString();
          router.replace(query ? `/?${query}` : '/');
        }
      }
    } catch (error) {
      if (signal?.aborted) return;
      setChannels([]);
    }
  }, [isAuthenticated, authFetch, router, searchParams, selectedChannelId]);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      const isoYear = fallbackIso.isoYear;
      const isoWeek = fallbackIso.isoWeek;
      const params = new URLSearchParams({
        channelId: selectedChannelId,
        isoYear: String(isoYear),
        isoWeek: String(isoWeek),
      });
      const query = `?${params.toString()}`;
      const [productionsRes, ideasRes, runsRes, weeklyRes, weeklyGoalsRes, disciplineRes, reconcileRes] = await Promise.all([
        authFetch('/api/productions?stats=true', { signal }),
        authFetch('/api/ideas', { signal }),
        authFetch('/api/automation-runs', { signal }),
        authFetch(`/api/weekly-status${query}`, { signal }),
        authFetch(`/api/weekly-goals${query}`, { signal }),
        authFetch(`/api/discipline/weekly${query}`, { signal }),
        selectedChannelId
          ? authFetch(`/api/integrations/youtube/reconcile/weekly${query}&channelId=${selectedChannelId}`, { signal })
          : Promise.resolve(new Response(null, { status: 204 }))
      ]);

      if (productionsRes.ok) {
        const data = await productionsRes.json();
        setProductions(data.productions || []);
        if (data.pipeline) {
          setPipelineStats({
            idea: data.pipeline.idea || 0,
            scripting: data.pipeline.scripting || 0,
            recording: data.pipeline.recording || 0,
            editing: data.pipeline.editing || 0,
            shorts: data.pipeline.shorts || 0,
            publishing: data.pipeline.publishing || 0,
            published: data.pipeline.published || 0,
          });
        }
      }

      if (ideasRes.ok) {
        const ideasData = await ideasRes.json();
        const ideasList = Array.isArray(ideasData) ? ideasData : [];
        setIdeas(ideasList.map((idea: { id: string; title: string; status: string; priority: number }) => idea));
      }
      if (runsRes.ok) {
        const runsData = await runsRes.json();
        setRuns(Array.isArray(runsData) ? runsData : []);
      } else {
        setRuns([]);
      }

      if (weeklyRes.ok) {
        const weeklyData: WeeklyStatus = await weeklyRes.json();
        setWeeklyStatus(weeklyData);
        setWeeklyActions(Array.isArray(weeklyData.tasks) ? weeklyData.tasks : []);
        setWeeklyError(null);
      } else {
        const errorData = await weeklyRes.json().catch(() => null);
        setWeeklyError(errorData?.error || 'Error al cargar estado semanal');
        setWeeklyStatus(null);
        setWeeklyActions([]);
      }

      if (weeklyGoalsRes.ok) {
        const goalsData: WeeklyGoalResponse = await weeklyGoalsRes.json();
        setWeeklyGoal(goalsData);
      } else {
        setWeeklyGoal(null);
      }

      if (disciplineRes.ok) {
        const disciplineData: DisciplineWeekly = await disciplineRes.json();
        setDisciplineWeekly(disciplineData);
      } else {
        setDisciplineWeekly(null);
      }

      if (reconcileRes.ok && reconcileRes.status !== 204) {
        const reconcileData: YoutubeReconcileWeekly = await reconcileRes.json();
        setReconcileWeekly(reconcileData);
      } else {
        setReconcileWeekly(null);
      }
    } catch (e) {
      if (signal?.aborted) return;
      console.error('Error:', e);
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  }, [authFetch, selectedChannelId, fallbackIso.isoYear, fallbackIso.isoWeek]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    fetchChannels(controller.signal);
    fetchData(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated, fetchChannels, fetchData]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const hasChannel = channels.length > 0;
    const hasIdeas = ideas.length > 0;
    const shouldShow = !hasChannel || !hasIdeas;
    setShowStartCard(shouldShow);
  }, [isAuthenticated, channels.length, ideas.length]);

  useEffect(() => {
    if (searchParams?.get('new') === '1') {
      setShowModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!showModal && !publishTarget) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModal(false);
        setPublishTarget(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showModal, publishTarget]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await authFetch('/api/productions', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setNewTitle('');
        setShowModal(false);
        fetchData();
      addToast(DASHBOARD_COPY.toasts.created, 'success');
      } else {
      addToast(DASHBOARD_COPY.toasts.createFailed, 'error');
      }
    } catch (e) {
      addToast(DASHBOARD_COPY.toasts.createError, 'error');
      console.error('Error:', e);
    }
  };

  const handlePublish = async () => {
    if (!publishTarget) return;
    if (publishMissing.length > 0) {
      addToast(`Completa: ${publishMissing.join(', ')}`, 'error');
      return;
    }
    setPublishSubmitting(true);
    try {
      const response = await authFetch('/api/productions/publish', {
        method: 'POST',
        body: JSON.stringify({
          productionId: publishTarget.id,
          publishedUrl: publishUrl.trim() || null,
          platformId: publishPlatformId.trim() || null,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al marcar como publicado');
      }
      setPublishTarget(null);
      setPublishUrl('');
      setPublishPlatformId('');
      setPublishPlatformTouched(false);
      fetchData();
      addToast('Publicado', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Error al marcar como publicado', 'error');
    } finally {
      setPublishSubmitting(false);
    }
  };

  const extractYouTubeId = (value: string) => {
    if (!value) return '';
    try {
      const url = new URL(value);
      const id = url.searchParams.get('v');
      if (id) return id;
      if (url.hostname.includes('youtu.be')) {
        return url.pathname.replace('/', '').trim();
      }
      return '';
    } catch {
      return '';
    }
  };

  const handleGeneratePlan = async () => {
    if (!selectedChannelId) {
      addToast('Selecciona un canal primero', 'error');
      return;
    }
    setPlanSubmitting(true);
    try {
      const isoYear = weeklyStatus?.week.isoYear ?? fallbackIso.isoYear;
      const isoWeek = weeklyStatus?.week.isoWeek ?? fallbackIso.isoWeek;
      const params = new URLSearchParams({
        channelId: selectedChannelId,
        isoYear: String(isoYear),
        isoWeek: String(isoWeek),
      });
      const response = await authFetch(`/api/weekly-plan/generate?${params.toString()}`, {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al generar plan');
      }
      addToast('Plan semanal generado', 'success');
      fetchData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Error al generar plan', 'error');
    } finally {
      setPlanSubmitting(false);
    }
  };

  const handleChannelChange = (value: string) => {
    setSelectedChannelId(value);
    if (typeof window !== 'undefined') {
      if (value) {
        window.localStorage.setItem('cronostudio.channelId', value);
      } else {
        window.localStorage.removeItem('cronostudio.channelId');
      }
    }
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (value) {
      params.set('channelId', value);
    } else {
      params.delete('channelId');
    }
    const query = params.toString();
    router.replace(query ? `/?${query}` : '/');
  };

  const stageLabels: Record<keyof PipelineStats, string> = STAGE_LABELS;
  const statusStyles: Record<string, { badge: string; dot: string; text: string }> = {
    OK: { badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400', text: 'text-emerald-200' },
    EN_RIESGO: { badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30', dot: 'bg-amber-400', text: 'text-amber-200' },
    FALLIDA: { badge: 'bg-red-500/15 text-red-300 border-red-500/30', dot: 'bg-red-400', text: 'text-red-200' },
    CUMPLIDA: { badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30', dot: 'bg-sky-400', text: 'text-sky-200' },
  };
  const weeklyStyle = weeklyStatus ? statusStyles[weeklyStatus.status] : statusStyles.OK;
  const nextConditionText = weeklyStatus?.nextCondition?.label ?? DASHBOARD_COPY.weeklyStatus.noNext;
  const nextConditionDue = weeklyStatus?.nextCondition?.dueAt
    ? formatDateTime(weeklyStatus.nextCondition.dueAt)
    : null;
  const goalData = weeklyGoal?.goal ?? weeklyStatus?.goal ?? null;
  const weekLabel = loading
    ? '--'
    : weeklyStatus
      ? `${weeklyStatus.week.isoYear}-W${String(weeklyStatus.week.isoWeek).padStart(2, '0')}`
      : weeklyGoal
        ? `${weeklyGoal.isoYear}-W${String(weeklyGoal.isoWeek).padStart(2, '0')}`
        : `${fallbackIso.isoYear}-W${String(fallbackIso.isoWeek).padStart(2, '0')}`;
  const dayLabels: Record<string, string> = {
    monday: 'Lun',
    tuesday: 'Mar',
    wednesday: 'Mie',
    thursday: 'Jue',
    friday: 'Vie',
    saturday: 'Sab',
    sunday: 'Dom',
  };
  const goalDays = goalData?.diasPublicacion
    ? goalData.diasPublicacion.map((day) => dayLabels[day] || day).join('/')
    : '--';
  const publishedCount = weeklyStatus?.publishedCount ?? 0;
  const weeklyTarget = goalData?.targetVideos ?? 0;
  const channelName = weeklyStatus?.channel?.name ?? weeklyGoal?.channel?.name ?? '';
  const channelSource = weeklyStatus?.channelSource ?? weeklyGoal?.channelSource;
  const isDefaultChannel = channelSource === 'default';
  const streakCurrent = weeklyStatus?.currentStreak ?? 0;
  const streakBest = weeklyStatus?.bestStreak ?? 0;
  const last4Weeks = weeklyStatus?.last4Weeks ?? [];
  const streakColors: Record<string, string> = {
    OK: 'bg-emerald-400',
    EN_RIESGO: 'bg-amber-400',
    FALLIDA: 'bg-red-400',
    CUMPLIDA: 'bg-sky-400',
  };

  const disciplineStatus = disciplineWeekly?.status ?? 'OK';
  const disciplineStyle = statusStyles[disciplineStatus] ?? statusStyles.OK;
  const disciplineCount = disciplineWeekly?.scoreboard.count ?? 0;
  const disciplineTarget = disciplineWeekly?.scoreboard.target ?? 2;
  const disciplineMissing = Math.max(disciplineTarget - disciplineCount, 0);
  const disciplineStreakCurrent = disciplineWeekly?.streak.current ?? 0;
  const disciplineStreakBest = disciplineWeekly?.streak.best ?? 0;

  const slotConfig = [
    { key: 'tue' as const, label: 'Mar' },
    { key: 'fri' as const, label: 'Vie' },
  ];

  const slotStatus = (slot: 'tue' | 'fri') => {
    const reconcile = reconcileWeekly?.reconciliation[slot];
    if (reconcile === 'ok') {
      return { tone: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/40', dot: 'bg-emerald-400', label: 'OK' };
    }
    if (reconcile === 'missing_publish_event') {
      return { tone: 'bg-amber-400/15 text-amber-200 border-amber-400/40', dot: 'bg-amber-400', label: 'Registrar' };
    }
    if (reconcile === 'missing_youtube_video') {
      return { tone: 'bg-slate-400/10 text-slate-300 border-slate-400/30', dot: 'bg-slate-400', label: 'Sin video' };
    }
    return { tone: 'bg-slate-400/10 text-slate-300 border-slate-400/30', dot: 'bg-slate-400', label: 'Pendiente' };
  };

  const registerNeedsAttention = disciplineMissing > 0 ||
    (reconcileWeekly?.reconciliation.tue === 'missing_publish_event' || reconcileWeekly?.reconciliation.fri === 'missing_publish_event');

  const drawerLabel = drawerSlot === 'tue' ? 'Martes' : drawerSlot === 'fri' ? 'Viernes' : '';
  const drawerEvidence = drawerSlot ? reconcileWeekly?.youtubeEvidence[drawerSlot] : null;
  const drawerPublish = drawerSlot ? reconcileWeekly?.publishEvents[drawerSlot] : null;
  const drawerReconcile = drawerSlot ? reconcileWeekly?.reconciliation[drawerSlot] : null;
  const drawerHasAction = drawerReconcile === 'missing_publish_event';

  const plannedDays = useMemo(() => {
    const map = { tue: 'Pendiente', fri: 'Pendiente' } as Record<'tue' | 'fri', string>;
    const planned = weeklyStatus?.plannedProductions || [];
    planned.forEach((item) => {
      if (item.day === 'tuesday') map.tue = 'Planificado';
      if (item.day === 'friday') map.fri = 'Planificado';
    });
    return map;
  }, [weeklyStatus?.plannedProductions]);

  const nextStepCopy = useMemo(() => {
    if (reconcileWeekly?.reconciliation.tue === 'missing_publish_event' || reconcileWeekly?.reconciliation.fri === 'missing_publish_event') {
      return { label: 'Falta registrar publicaciones detectadas en YouTube', action: 'Registrar' };
    }
    if (disciplineMissing > 0) {
      return { label: `Falta ${disciplineMissing} publicación${disciplineMissing > 1 ? 'es' : ''} esta semana`, action: 'Registrar' };
    }
    return { label: 'Semana completa. Planifica la próxima.', action: 'Planificar' };
  }, [disciplineMissing, reconcileWeekly]);

  const handleQuickPublish = async (targetDay: 'tuesday' | 'friday') => {
    if (!selectedChannelId) {
      addToast('Selecciona un canal primero', 'error');
      return;
    }
    setQuickPublishSubmitting(true);
    try {
      const response = await authFetch('/api/discipline/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: selectedChannelId, targetDay }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'No se pudo registrar la publicación');
      }
      addToast('Publicación registrada', 'success');
      fetchData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Error al registrar publicación', 'error');
    } finally {
      setQuickPublishSubmitting(false);
    }
  };

  const handleRegisterFromYoutube = async (slot: 'tue' | 'fri') => {
    if (!selectedChannelId || !reconcileWeekly) {
      addToast('Selecciona un canal primero', 'error');
      return;
    }
    const action = reconcileWeekly.suggestedActions.find((item) => item.slot === slot);
    if (!action) return;
    setReconcileSubmitting(true);
    try {
      const response = await authFetch('/api/discipline/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'No se pudo registrar la publicación');
      }
      addToast('Publicación registrada desde YouTube', 'success');
      fetchData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Error al registrar publicación', 'error');
    } finally {
      setReconcileSubmitting(false);
    }
  };

  const openDrawerForSlot = (slot: 'tue' | 'fri') => {
    setDrawerSlot(slot);
    setDrawerOpen(true);
  };

  const nextSlot = useMemo<'tue' | 'fri'>(() => {
    if (reconcileWeekly) {
      if (reconcileWeekly.reconciliation.tue !== 'ok') return 'tue';
      if (reconcileWeekly.reconciliation.fri !== 'ok') return 'fri';
    }
    return disciplineMissing > 0 ? 'tue' : 'fri';
  }, [reconcileWeekly, disciplineMissing]);

  const handleDockRegister = () => {
    openDrawerForSlot(nextSlot);
  };

  const handleDockPlan = () => {
    setActiveTab('calendar');
    if (reduceMotion) {
      calendarRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
      calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDockVerify = () => {
    fetchData();
    openDrawerForSlot(nextSlot);
  };

  const handleTourStart = () => {
    setTourStep(0);
    setTourOpen(true);
  };

  const handleTourClose = () => {
    setTourOpen(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cronostudio_tour_completed', 'true');
    }
  };

  const handleTourNext = () => {
    if (tourStep >= TOUR_STEPS.length - 1) {
      handleTourClose();
      return;
    }
    setTourStep((step) => step + 1);
  };

  const handleTourBack = () => {
    setTourStep((step) => Math.max(step - 1, 0));
  };

  const priorityActions = weeklyStatus ? weeklyActions : generatePriorityActions(productions);
  const activeProductions = productions.filter(p => p.status !== 'published');
  const focusProduction = useMemo(() => {
    const base = activeStage
      ? activeProductions.filter((production) => production.status === activeStage)
      : activeProductions;
    if (focusedProductionId) {
      const match = base.find((production) => production.id === focusedProductionId);
      if (match) return match;
    }
    return [...base].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] ?? null;
  }, [activeProductions, activeStage, focusedProductionId]);
  const focusChecklist = focusProduction ? getChecklistStatus(focusProduction) : null;
  const publishChecklist = publishTarget ? getChecklistStatus(publishTarget) : null;
  const publishMissing = publishChecklist
    ? [
        !publishChecklist.scriptReady ? 'Guion' : null,
        !publishChecklist.seoReady ? 'SEO' : null,
        !publishChecklist.thumbnailReady ? 'Miniatura' : null,
      ].filter(Boolean)
    : [];
  const filteredProductions = activeStage
    ? activeProductions.filter((production) => production.status === activeStage)
    : activeProductions;

  const filteredIdeas = activeStage === 'idea'
    ? ideas.filter((idea) => idea.status !== 'archived')
    : [];

  const scheduledProductions = useMemo(
    () => productions.filter((production) => production.target_date),
    [productions]
  );

  const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);
  const scheduledByDate = useMemo(() => {
    const map = new Map<string, Production[]>();
    scheduledProductions.forEach((production) => {
      if (!production.target_date) return;
      const key = production.target_date.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(production);
      map.set(key, list);
    });
    return map;
  }, [scheduledProductions]);

  const upcomingScheduled = useMemo(() => {
    return scheduledProductions
      .filter((production) => production.target_date)
      .sort((a, b) => (a.target_date || '').localeCompare(b.target_date || ''))
      .slice(0, 5);
  }, [scheduledProductions]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (string | null)[] = [];
    for (let i = 0; i < startWeekday; i += 1) days.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      days.push(formatDateKey(date));
    }
    return days;
  }, [calendarMonth]);

  const weeklyDays = useMemo(() => {
    const base = selectedDate ? new Date(selectedDate) : new Date();
    const start = new Date(base);
    start.setDate(base.getDate() - base.getDay());
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return formatDateKey(date);
    });
  }, [selectedDate]);

  const handleSchedule = async () => {
    if (!scheduleProductionId || !scheduleDate) return;
    try {
      const response = await authFetch(`/api/productions?id=${scheduleProductionId}`, {
        method: 'PUT',
        body: JSON.stringify({ targetDate: scheduleDate }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al programar publicación');
      }
      addToast(DASHBOARD_COPY.toasts.scheduled, 'success');
      setScheduleProductionId('');
      setScheduleDate('');
      fetchData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : DASHBOARD_COPY.toasts.scheduleError, 'error');
    }
  };

  const handleUnschedule = async (productionId: string) => {
    try {
      const response = await authFetch(`/api/productions?id=${productionId}`, {
        method: 'PUT',
        body: JSON.stringify({ targetDate: null }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cancelar publicación');
      }
      addToast(DASHBOARD_COPY.toasts.canceled, 'success');
      fetchData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : DASHBOARD_COPY.toasts.cancelError, 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />
      <PageTransition className="flex-1">
          <main className="w-full max-w-full px-4 sm:px-6 lg:px-12 py-6 sm:py-8 pb-24 lg:pb-8">
            {/* Context bar */}
            <motion.div
              className="surface-card glow-hover p-4 sm:p-5 mb-6"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">
                    {DASHBOARD_COPY.context.title}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="rounded-full border border-gray-800 px-3 py-1 text-slate-200">
                      {DASHBOARD_COPY.context.isoWeek}: {weekLabel}
                    </span>
                    {goalData && (
                      <span className="rounded-full border border-gray-800 px-3 py-1 text-slate-200">
                        {DASHBOARD_COPY.context.goal}: {weeklyTarget} {DASHBOARD_COPY.context.videos} · {goalDays} · {goalData.horaCorte}
                      </span>
                    )}
                    {weeklyTarget > 0 && (
                      <span className="rounded-full border border-gray-800 px-3 py-1 text-slate-200">
                        {DASHBOARD_COPY.context.published}: {publishedCount}/{weeklyTarget}
                      </span>
                    )}
                  </div>
                  {weeklyError && (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-red-300">
                      <span>No se pudo evaluar la semana.</span>
                      <button
                        type="button"
                        onClick={() => fetchData()}
                        className="text-yellow-300 hover:text-yellow-200 underline"
                      >
                        Reintentar
                      </button>
                    </div>
                  )}
                  {isDefaultChannel && channelName && (
                    <p className="text-xs text-amber-200">
                      {DASHBOARD_COPY.context.defaultChannel}: {channelName}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-[0.2em]">
                    {DASHBOARD_COPY.context.channel}
                  </label>
                  <select
                    value={selectedChannelId}
                    onChange={(event) => handleChannelChange(event.target.value)}
                    className="w-full min-w-[220px] rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white"
                    disabled={channels.length === 0}
                  >
                    <option value="">{channels.length === 0 ? DASHBOARD_COPY.context.noChannels : DASHBOARD_COPY.context.selectChannel}</option>
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
            {(weeklyStatus?.planGenerated === false || weeklyError) && (
              <motion.div
                className="surface-card glow-hover p-5 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div>
                  <p className="text-sm text-slate-300">Plan semanal automático</p>
                  <p className="text-xs text-slate-400">2 videos: Mar/Vie</p>
                </div>
                <motion.button
                  type="button"
                  onClick={handleGeneratePlan}
                  className="px-5 py-3 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={planSubmitting}
                >
                  {planSubmitting ? 'Generando...' : 'Generar plan semanal (2 videos: Mar/Vie)'}
                </motion.button>
              </motion.div>
            )}

            {showStartCard && (
              <motion.div
                className="surface-card glow-hover p-5 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div>
                  <p className="text-sm text-slate-300">Primeros pasos recomendados</p>
                  <p className="text-xs text-slate-400">Conecta canal, genera ideas y arranca el pipeline.</p>
                </div>
                <Link
                  href="/start"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-400 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                >
                  Ver guia
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}

            {/* Header */}
            <motion.div
              className="mb-8 sm:mb-10"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-yellow-400/90 mb-3">
                    <Sparkles className="w-4 h-4" />
                    {DASHBOARD_COPY.header.tag}
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-3">
                    {DASHBOARD_COPY.header.title}
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl">
                    {DASHBOARD_COPY.header.subtitle}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <motion.button
                    onClick={() => setShowModal(true)}
                    className="inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-black rounded-lg sm:w-auto"
                    style={{
                      background: 'linear-gradient(135deg, rgba(246, 201, 69, 0.95), rgba(246, 201, 69, 0.7))',
                      boxShadow: '0 10px 20px rgba(246, 201, 69, 0.22)',
                    }}
                    whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  >
            <Plus className="w-4 h-4" />
            {DASHBOARD_COPY.fab.label}
                  </motion.button>
                  <button
                    type="button"
                    onClick={handleTourStart}
                    className="hidden sm:inline-flex items-center justify-center gap-2 rounded-lg border border-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 hover:border-yellow-400/60"
                    title="Guíame"
                  >
                    Guíame
                  </button>
                </div>
              </div>
            </motion.div>

            <div className="mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar">
              {([
                { key: 'production', label: 'Producción' },
                { key: 'calendar', label: 'Calendario' },
                { key: 'backlog', label: 'Backlog' },
                { key: 'integrations', label: 'Integraciones' },
              ] as { key: DashboardTab; label: string }[]).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] sm:px-4 sm:text-xs ${
                    activeTab === tab.key
                      ? 'border-yellow-400/60 bg-yellow-400/10 text-yellow-200'
                      : 'border-gray-800 text-slate-400 hover:border-yellow-400/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <motion.div
                  className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Pipeline */}
                {activeTab === 'production' && (
                  <div data-tour="pipeline">
                    <ProductionPipeline
                      stats={pipelineStats}
                      activeStage={activeStage}
                      onStageClick={(stage) => setActiveStage((current) => (current === stage ? null : stage))}
                    />
                  </div>
                )}

                {/* Main grid */}
                <div className={`grid grid-cols-1 gap-4 sm:gap-6 items-start ${
                  activeTab === 'production'
                    ? 'lg:grid-cols-[minmax(0,1fr)_360px]'
                    : 'lg:grid-cols-2 2xl:grid-cols-3'
                }`}>
                  <div className={`space-y-5 ${activeTab === 'production' || activeTab === 'backlog' ? '' : 'hidden'}`} data-tour="backlog">
                    <motion.div
                      className="surface-card glow-hover p-4 sm:p-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em] mb-3">
                        {DASHBOARD_COPY.weeklyStreak.title}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">{DASHBOARD_COPY.weeklyStreak.current}</p>
                          <p className="text-lg font-semibold text-white">🔥 {streakCurrent} semanas</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">{DASHBOARD_COPY.weeklyStreak.best}</p>
                          <p className="text-lg font-semibold text-white">🏆 {streakBest} semanas</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        {(last4Weeks.length > 0 ? last4Weeks : Array.from({ length: 4 }).map(() => ({ status: 'EN_RIESGO' })))
                          .slice(0, 4)
                          .map((week, index) => (
                            <span
                              key={`${week.status}-${index}`}
                              className={`h-3 w-3 rounded-full ${streakColors[week.status] || 'bg-gray-700'}`}
                              title={week.status}
                            />
                          ))}
                      </div>
                    </motion.div>

                    <motion.div
                      className="surface-card glow-hover p-4 sm:p-5"
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : 0.05 }}
                      data-tour="week-stepper"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">
                            Esta semana
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Semana {disciplineWeekly?.week.weekKey ?? weekLabel} · 2 publicaciones</p>
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${disciplineStyle.badge}`}>
                          <span className={`h-2 w-2 rounded-full ${disciplineStyle.dot}`} />
                          {disciplineStatus}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Progreso</p>
                          <p className="mt-1 text-2xl font-semibold text-white">
                            {disciplineCount}/{disciplineTarget}
                          </p>
                          <p className="text-xs text-slate-400">Faltan {disciplineMissing}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Racha</p>
                          <p className="mt-1 text-lg font-semibold text-white">🔥 {disciplineStreakCurrent}</p>
                          <p className="text-xs text-slate-400">Mejor: {disciplineStreakBest}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {slotConfig.map((slot) => {
                          const status = slotStatus(slot.key);
                          return (
                            <button
                              key={slot.key}
                              type="button"
                              onClick={() => openDrawerForSlot(slot.key)}
                              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${status.tone}`}
                              title="Ver detalle"
                            >
                              <span className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                                {slot.label}
                              </span>
                              <span>{status.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-4 lg:hidden">
                        <button
                          type="button"
                          onClick={() => setFocusOpen((current) => !current)}
                          className="w-full rounded-lg border border-gray-800 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300"
                        >
                          {focusOpen ? 'Ocultar foco' : 'Mostrar foco'}
                        </button>
                        {focusOpen && (
                          <div className="mt-3 space-y-3 rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Próximo paso</div>
                              <p className="mt-1 text-sm text-slate-200">{nextStepCopy.label}</p>
                              <button
                                type="button"
                                onClick={nextStepCopy.action === 'Registrar' ? handleDockRegister : handleDockPlan}
                                className="mt-3 w-full rounded-lg bg-yellow-400 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                              >
                                {nextStepCopy.action}
                              </button>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Verificado por YouTube</div>
                              <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
                                <span>Mar</span>
                                <span>{slotStatus('tue').label}</span>
                              </div>
                              <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
                                <span>Vie</span>
                                <span>{slotStatus('fri').label}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => openDrawerForSlot(nextSlot)}
                                className="mt-2 w-full rounded-lg border border-gray-800 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                              >
                                Abrir detalle
                              </button>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Plan semanal</div>
                              <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
                                <span>Mar</span>
                                <span>{plannedDays.tue}</span>
                              </div>
                              <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
                                <span>Vie</span>
                                <span>{plannedDays.fri}</span>
                              </div>
                              <button
                                type="button"
                                onClick={handleDockPlan}
                                className="mt-2 w-full rounded-lg border border-gray-800 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                              >
                                Ir a Calendario
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => setActiveTab('calendar')}
                                className="rounded-lg border border-gray-800 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
                              >
                                Calendario
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveTab('backlog')}
                                className="rounded-lg border border-gray-800 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
                              >
                                Backlog
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveTab('integrations')}
                                className="rounded-lg border border-gray-800 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
                              >
                                Integraciones
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    <motion.div
                      className="surface-card glow-hover p-4 sm:p-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">
                            {DASHBOARD_COPY.weeklyStatus.title}
                          </div>
                          {weeklyStatus?.channel && (
                            <p className="text-xs text-slate-400 mt-1">
                              {DASHBOARD_COPY.weeklyStatus.channel}: {weeklyStatus.channel.name}
                            </p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${weeklyStyle.badge}`}>
                          <span className={`h-2 w-2 rounded-full ${weeklyStyle.dot}`} />
                          {weeklyStatus?.status ?? 'OK'}
                        </span>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="text-xs font-semibold text-slate-300 uppercase tracking-[0.2em]">
                          {DASHBOARD_COPY.weeklyStatus.next}
                        </div>
                        <p className={`text-sm ${weeklyStyle.text}`}>{nextConditionText}</p>
                        {nextConditionDue && (
                          <p className="text-xs text-slate-400">{nextConditionDue}</p>
                        )}
                      </div>
                    </motion.div>

                    <PriorityActions
                      actions={priorityActions}
                      showCreateButton={false}
                    />

                    {activeStage === 'idea' ? (
                    <motion.div
                       className="surface-card glow-hover overflow-hidden"
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ duration: 0.3, delay: 0.1 }}
                     >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-800 bg-gray-900/60">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <span className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">{DASHBOARD_COPY.pipeline.ideasActive}</span>
                          <button
                            type="button"
                            onClick={() => setActiveStage(null)}
                            className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-300 hover:border-yellow-400/60"
                          >
                            {stageLabels.idea}
                            <span aria-hidden="true">×</span>
                          </button>
                        </div>
                          <span className="text-xs text-slate-400">{filteredIdeas.length} {DASHBOARD_COPY.pipeline.ideasCountLabel}</span>
                      </div>
                        <div className="divide-y divide-gray-800/50">
                          {filteredIdeas.length === 0 ? (
                          <div className="px-4 sm:px-5 py-6 text-slate-300">{DASHBOARD_COPY.pipeline.noIdeas}</div>
                        ) : (
                          filteredIdeas.slice(0, 6).map((idea) => (
                            <div key={idea.id} className="px-4 sm:px-5 py-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-white font-medium">{idea.title}</p>
                                  <p className="text-xs text-slate-400">Prioridad {idea.priority}</p>
                                </div>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-yellow-300">{idea.status}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <ProductionsList
                      productions={filteredProductions}
                      selectedProductionId={focusedProductionId}
                      onProductionClick={(production) => setFocusedProductionId(production.id)}
                      onMarkPublished={(production) => setPublishTarget(production)}
                      onCreateNew={() => setShowModal(true)}
                      filterLabel={activeStage ? stageLabels[activeStage] : null}
                      onClearFilter={() => setActiveStage(null)}
                      title={activeStage ? DASHBOARD_COPY.pipeline.inStage : DASHBOARD_COPY.pipeline.active}
                      showCreateButton={false}
                    />
                  )}
                  </div>

                  {activeTab === 'production' && (
                    <div className="hidden space-y-4 lg:block lg:sticky lg:top-24">
                      <div className="surface-card glow-hover p-4 sm:p-5">
                        <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">Checklist final</div>
                        {focusProduction ? (
                          <div className="mt-3 space-y-2 text-xs text-slate-300">
                            <div className="text-sm text-slate-200 font-semibold truncate">{focusProduction.title}</div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                              <span className="uppercase tracking-[0.2em]">Estado</span>
                              <span className="rounded-full border border-gray-800 px-2 py-0.5 text-slate-200">
                                {stageLabels[focusProduction.status] ?? focusProduction.status}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span>{focusProduction.channel_name ?? 'Sin canal'}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                              <span>Fecha objetivo:</span>
                              <span className="text-slate-200">
                                {focusProduction.target_date
                                  ? formatDate(focusProduction.target_date)
                                  : 'Sin fecha'}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span>
                                Actualizado {formatDate(focusProduction.updated_at)}
                              </span>
                            </div>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  {focusChecklist?.scriptReady ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <XCircle className="h-3 w-3 text-slate-500" />}
                                  Guion listo
                                </span>
                                {!focusChecklist?.scriptReady && (
                                  <Link
                                    href={`/ai?profile=script_architect${focusProduction?.idea_id ? `&ideaId=${focusProduction.idea_id}` : ''}${focusProduction?.channel_id ? `&channelId=${focusProduction.channel_id}` : ''}`}
                                    className="text-emerald-300 hover:text-emerald-200"
                                  >
                                    Generar
                                  </Link>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  {focusChecklist?.seoReady ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <XCircle className="h-3 w-3 text-slate-500" />}
                                  SEO aprobado
                                </span>
                                {!focusChecklist?.seoReady && (
                                  <Link
                                    href={`/ai?profile=titles_thumbs${focusProduction?.idea_id ? `&ideaId=${focusProduction.idea_id}` : ''}${focusProduction?.script_id ? `&scriptId=${focusProduction.script_id}` : ''}${focusProduction?.channel_id ? `&channelId=${focusProduction.channel_id}` : ''}`}
                                    className="text-sky-300 hover:text-sky-200"
                                  >
                                    Generar
                                  </Link>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  {focusChecklist?.thumbnailReady ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <XCircle className="h-3 w-3 text-slate-500" />}
                                  Miniatura aprobada
                                </span>
                                {!focusChecklist?.thumbnailReady && (
                                  <Link
                                    href={`/thumbnails${focusProduction?.channel_id ? `?channelId=${focusProduction.channel_id}` : ''}`}
                                    className="text-yellow-300 hover:text-yellow-200"
                                  >
                                    Ver
                                  </Link>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  {focusChecklist?.published ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <XCircle className="h-3 w-3 text-slate-500" />}
                                  Publicado
                                </span>
                                {!focusChecklist?.published && (
                                  <button
                                    type="button"
                                    onClick={() => setPublishTarget(focusProduction)}
                                    className="text-yellow-300 hover:text-yellow-200"
                                  >
                                    Marcar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 text-xs text-slate-400">No hay producciones activas.</div>
                        )}
                      </div>

                      <div className="surface-card glow-hover p-4 sm:p-5">
                        <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">Próximo paso</div>
                        <p className="mt-3 text-sm text-slate-200">{nextStepCopy.label}</p>
                        <button
                          type="button"
                          onClick={nextStepCopy.action === 'Registrar' ? handleDockRegister : handleDockPlan}
                          className="mt-4 w-full rounded-lg bg-yellow-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                        >
                          {nextStepCopy.action}
                        </button>
                      </div>

                      <div className="surface-card glow-hover p-4 sm:p-5">
                        <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">Verificado por YouTube</div>
                        <div className="mt-3 space-y-2 text-xs text-slate-300">
                          {slotConfig.map((slot) => {
                            const status = slotStatus(slot.key);
                            return (
                              <div key={slot.key} className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                                  {slot.label}
                                </span>
                                <span>{status.label}</span>
                              </div>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => openDrawerForSlot(nextSlot)}
                          className="mt-4 w-full rounded-lg border border-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                        >
                          Abrir detalle
                        </button>
                      </div>

                      <div className="surface-card glow-hover p-4 sm:p-5">
                        <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">Plan semanal</div>
                        <div className="mt-3 space-y-2 text-xs text-slate-300">
                          <div className="flex items-center justify-between">
                            <span>Mar</span>
                            <span>{plannedDays.tue}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Vie</span>
                            <span>{plannedDays.fri}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleDockPlan}
                          className="mt-4 w-full rounded-lg border border-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                        >
                          Ir a Calendario
                        </button>
                      </div>

                      <div className="surface-card glow-hover p-4 sm:p-5">
                        <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">Atajos</div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('calendar')}
                            className="rounded-lg border border-gray-800 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
                          >
                            Calendario
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('backlog')}
                            className="rounded-lg border border-gray-800 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
                          >
                            Backlog
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('integrations')}
                            className="rounded-lg border border-gray-800 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
                          >
                            Integraciones
                          </button>
                          <button
                            type="button"
                            onClick={handleDockRegister}
                            className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-200"
                          >
                            Registrar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`space-y-4 ${activeTab === 'calendar' ? '' : 'hidden'}`} data-tour="calendar" ref={calendarRef}>
                    <motion.div
                      className="surface-card glow-hover p-4 sm:p-6 sm:min-h-[520px]"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div>
                          <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">{DASHBOARD_COPY.calendar.title}</div>
                          <p className="text-xs sm:text-sm text-slate-300">{DASHBOARD_COPY.calendar.subtitle}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex rounded-full border border-gray-700 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setCalendarView('month')}
                              className={`px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                                calendarView === 'month'
                                  ? 'bg-yellow-400 text-black'
                                  : 'text-slate-300'
                              }`}
                            >
                              {DASHBOARD_COPY.calendar.month}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCalendarView('week')}
                              className={`px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                                calendarView === 'week'
                                  ? 'bg-yellow-400 text-black'
                                  : 'text-slate-300'
                              }`}
                            >
                              {DASHBOARD_COPY.calendar.week}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                            className="text-xs px-2 py-1 border border-gray-700 rounded hover:border-yellow-400"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                            className="text-xs px-2 py-1 border border-gray-700 rounded hover:border-yellow-400"
                          >
                            →
                          </button>
                        </div>
                      </div>

                      <div className="text-sm sm:text-base font-semibold text-white mb-3 capitalize">
                        {formatMonthYear(calendarMonth)}
                      </div>

                      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-[9px] sm:text-[10px] text-slate-400 mb-2">
                        {DASHBOARD_COPY.calendar.weekdays.map((day) => (
                          <span key={day} className="text-center">{day}</span>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {(calendarView === 'month' ? calendarDays : weeklyDays).map((dateKey, index) => {
                          if (!dateKey) {
                            return <span key={`empty-${index}`} />;
                          }
                          const day = Number(dateKey.slice(8, 10));
                          const scheduled = scheduledByDate.get(dateKey) || [];
                          const isSelected = selectedDate === dateKey;
                          return (
                            <button
                              key={dateKey}
                              type="button"
                              onClick={() => {
                                setSelectedDate(dateKey);
                                setScheduleDate(dateKey);
                              }}
                              className={`relative flex h-8 sm:h-9 items-center justify-center rounded-lg text-[11px] sm:text-xs ${
                                isSelected
                                  ? 'bg-yellow-400 text-black'
                                  : 'bg-gray-900/60 text-slate-200 hover:bg-gray-800'
                              }`}
                            >
                              {day}
                              {scheduled.length > 0 && (
                                <span className={`absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-black/60' : 'bg-yellow-400'}`} />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="text-xs font-semibold text-slate-300 uppercase tracking-[0.2em]">{DASHBOARD_COPY.calendar.schedule}</div>
                        <select
                          value={scheduleProductionId}
                          onChange={(event) => setScheduleProductionId(event.target.value)}
                          className="w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white"
                        >
                          <option value="">{DASHBOARD_COPY.calendar.selectContent}</option>
                          {activeProductions.map((production) => (
                            <option key={production.id} value={production.id}>
                              {production.title}
                            </option>
                          ))}
                        </select>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(event) => setScheduleDate(event.target.value)}
                          className="w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white"
                        />
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={handleSchedule}
                            className="w-full rounded-lg bg-yellow-400 px-3 py-2 text-sm font-semibold text-black hover:bg-yellow-300"
                          >
                            {DASHBOARD_COPY.calendar.scheduleAction}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setScheduleProductionId('');
                              setScheduleDate('');
                            }}
                            className="w-full rounded-lg border border-gray-700 px-3 py-2 text-sm text-slate-200 hover:bg-gray-800"
                          >
                            {DASHBOARD_COPY.calendar.clear}
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-gray-800 pt-4">
                        <div className="text-xs font-semibold text-slate-300 uppercase tracking-[0.2em] mb-3">{DASHBOARD_COPY.calendar.agenda}</div>
                        {selectedDate ? (
                          <div className="space-y-2">
                            {(scheduledByDate.get(selectedDate) || []).length === 0 && (
                              <p className="text-xs text-slate-500">{DASHBOARD_COPY.calendar.emptyDay}</p>
                            )}
                            {(scheduledByDate.get(selectedDate) || []).map((production) => (
                              <div key={production.id} className="flex flex-col gap-2 rounded-lg border border-gray-800 px-3 py-2 text-sm text-slate-200 sm:flex-row sm:items-center sm:justify-between">
                                <span className="truncate">{production.title}</span>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  <span>{production.target_date ? formatDate(production.target_date) : ''}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setScheduleProductionId(production.id);
                                      setScheduleDate(production.target_date?.slice(0, 10) || selectedDate);
                                    }}
                                    className="text-yellow-300 hover:text-yellow-200"
                                  >
                                    {DASHBOARD_COPY.calendar.reschedule}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUnschedule(production.id)}
                                    className="text-red-300 hover:text-red-200"
                                  >
                                    {DASHBOARD_COPY.calendar.cancel}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {upcomingScheduled.length === 0 ? (
                              <p className="text-xs text-slate-500">{DASHBOARD_COPY.calendar.emptyUpcoming}</p>
                            ) : (
                              upcomingScheduled.map((production) => (
                                <div key={production.id} className="flex flex-col gap-2 rounded-lg border border-gray-800 px-3 py-2 text-sm text-slate-200 sm:flex-row sm:items-center sm:justify-between">
                                  <span className="truncate">{production.title}</span>
                                  <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span>{production.target_date ? formatDate(production.target_date) : ''}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedDate(production.target_date?.slice(0, 10) || null);
                                        setScheduleProductionId(production.id);
                                        setScheduleDate(production.target_date?.slice(0, 10) || '');
                                      }}
                                      className="text-yellow-300 hover:text-yellow-200"
                                    >
                                      {DASHBOARD_COPY.calendar.reschedule}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUnschedule(production.id)}
                                      className="text-red-300 hover:text-red-200"
                                    >
                                      {DASHBOARD_COPY.calendar.cancel}
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>

                    <AutomationRuns runs={runs} />

                  </div>

                  <motion.div className={`space-y-4 ${activeTab === 'integrations' ? '' : 'hidden'}`} data-tour="integrations">
                    <motion.div
                      className="surface-card glow-hover p-4 sm:p-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em] mb-4">{DASHBOARD_COPY.social.title}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3">
                        {DASHBOARD_COPY.social.items.map((item) => {
                          const iconMap: Record<string, ReactNode> = {
                            Instagram: <Instagram className="w-4 h-4" />,
                            TikTok: <Music2 className="w-4 h-4" />,
                            LinkedIn: <Linkedin className="w-4 h-4" />,
                            X: <Twitter className="w-4 h-4" />,
                          };
                          return (
                            <div key={item.name} className="flex flex-col gap-3 rounded-lg border border-gray-800 bg-gray-900/60 px-3 sm:px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                                  {iconMap[item.name]}
                                </span>
                                <div>
                                  <p className="text-sm font-semibold text-white">{item.name}</p>
                                  <p className="text-xs text-slate-400">{item.description}</p>
                                </div>
                              </div>
                              <button className="w-full text-xs font-semibold text-yellow-400 hover:text-yellow-300 sm:w-auto">{DASHBOARD_COPY.social.connect}</button>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            )}
        </main>
      </PageTransition>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur border-t border-gray-800 pb-[env(safe-area-inset-bottom)] lg:hidden" data-tour="action-dock">
        <div className="grid grid-cols-3 gap-2 px-3 py-3">
          <button
            type="button"
            onClick={handleDockRegister}
            className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] ${
              registerNeedsAttention
                ? 'bg-yellow-400 text-black'
                : 'border border-gray-700 text-slate-200'
            }`}
            title="Registrar"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/15 text-[12px] font-bold leading-none">
              +
            </span>
            <span className="min-w-0 truncate">Registrar</span>
          </button>
          <button
            type="button"
            onClick={handleDockPlan}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-800 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
            title="Planificar"
          >
            <Sparkles className="h-4 w-4" />
            <span className="min-w-0 truncate">Planificar</span>
          </button>
          <button
            type="button"
            onClick={handleDockVerify}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-800 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
            title="YouTube"
          >
            <span className="min-w-0 truncate">YouTube</span>
          </button>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-40 hidden lg:block" data-tour="action-dock">
        <div className="flex flex-col gap-2 rounded-2xl border border-gray-800 bg-gray-950/90 p-3 shadow-xl backdrop-blur">
          <button
            type="button"
            onClick={handleDockRegister}
            className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
              registerNeedsAttention
                ? 'bg-yellow-400 text-black'
                : 'border border-gray-700 text-slate-200 hover:border-yellow-400/50'
            }`}
            title="Registrar publicación"
          >
            Registrar
          </button>
          <button
            type="button"
            onClick={handleDockPlan}
            className="rounded-lg border border-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 hover:border-yellow-400/50"
            title="Planificar semana"
          >
            Planificar semana
          </button>
          <button
            type="button"
            onClick={handleDockVerify}
            className="rounded-lg border border-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 hover:border-yellow-400/50"
            title="Verificar YouTube"
          >
            Verificar YouTube
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div
            className={`absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t border-gray-800 bg-gray-950 p-6 lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:max-h-none lg:w-[min(92vw,420px)] lg:rounded-none lg:border-l ${
              reduceMotion ? '' : 'transition-transform duration-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/90">Detalle semanal</div>
                <h3 className="mt-2 text-lg font-semibold text-white">{drawerLabel}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="text-xs text-slate-400"
              >
                Cerrar
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">YouTube</div>
                {drawerEvidence?.matched ? (
                  <div className="mt-2 space-y-1 text-sm text-white">
                    <p className="font-medium">{drawerEvidence.video?.title}</p>
                    <p className="text-xs text-slate-400">{drawerEvidence.video?.publishedAt}</p>
                    <a
                      href={drawerEvidence.video?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-yellow-300"
                    >
                      Ver en YouTube
                    </a>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">Sin evidencia detectada</p>
                )}
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Publish event</div>
                {drawerPublish?.matched ? (
                  <p className="mt-2 text-sm text-white">Registrado · {drawerPublish.publishedAt}</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">Sin registro interno</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {drawerHasAction && (
                  <button
                    type="button"
                    onClick={() => drawerSlot && handleRegisterFromYoutube(drawerSlot)}
                    disabled={reconcileSubmitting}
                    className="rounded-lg bg-amber-400 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                  >
                    Registrar 1-click
                  </button>
                )}
                {drawerSlot && (
                  <button
                    type="button"
                    onClick={() => handleQuickPublish(drawerSlot === 'tue' ? 'tuesday' : 'friday')}
                    disabled={quickPublishSubmitting}
                    className="rounded-lg border border-gray-800 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                  >
                    Registrar manual
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <OnboardingTour
        open={tourOpen}
        stepIndex={tourStep}
        onClose={handleTourClose}
        onNext={handleTourNext}
        onBack={handleTourBack}
        reduceMotion={Boolean(reduceMotion)}
      />
      <Footer />

      {/* Modal */}
      {showModal && (
        <motion.div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowModal(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-modal-title"
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 sm:p-8 w-full max-w-lg max-h-[85vh] overflow-y-auto"
            ref={modalRef}
            tabIndex={-1}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="dashboard-modal-title" className="text-2xl font-semibold text-white mb-5">{DASHBOARD_COPY.modal.title}</h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={DASHBOARD_COPY.modal.placeholder}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-5 py-4 text-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none mb-5"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex flex-col gap-4 sm:flex-row">
              <motion.button
                onClick={() => setShowModal(false)}
                className="flex-1 px-5 py-3 text-base border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {DASHBOARD_COPY.modal.cancel}
              </motion.button>
              <motion.button
                onClick={handleCreate}
                className="flex-1 px-5 py-3 text-base bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {DASHBOARD_COPY.modal.create}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {publishTarget && (
        <motion.div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setPublishTarget(null)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-modal-title"
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 sm:p-8 w-full max-w-lg"
            ref={publishRef}
            tabIndex={-1}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="publish-modal-title" className="text-2xl font-semibold text-white mb-3">Marcar como publicado</h3>
            <p className="text-sm text-slate-300 mb-5">{publishTarget.title}</p>
            <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-xs text-yellow-200">
              Pegá la URL del video publicado para cerrar el pipeline y registrar el enlace.
            </div>
            {publishMissing.length > 0 && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                Faltan pasos: {publishMissing.join(', ')}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">URL publicado (opcional)</label>
                  <input
                    type="url"
                    value={publishUrl}
                    onChange={(event) => {
                      const next = event.target.value;
                      setPublishUrl(next);
                      if (!publishPlatformTouched) {
                        const extracted = extractYouTubeId(next);
                        setPublishPlatformId(extracted);
                      }
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ID de plataforma (opcional)</label>
                  <input
                    type="text"
                    value={publishPlatformId}
                    onChange={(event) => {
                      setPublishPlatformId(event.target.value);
                      setPublishPlatformTouched(true);
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                    placeholder="YouTube videoId"
                  />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <motion.button
                  onClick={() => setPublishTarget(null)}
                  className="flex-1 px-5 py-3 text-base border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={publishSubmitting}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  onClick={handlePublish}
                  className="flex-1 px-5 py-3 text-base bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={publishSubmitting || publishMissing.length > 0}
                >
                  {publishSubmitting ? 'Guardando...' : 'Marcar como publicado'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
               <p className="text-slate-300">{DASHBOARD_COPY.loading.dashboard}</p>
            </div>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
