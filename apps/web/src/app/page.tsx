'use client';

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Instagram, Linkedin, Music2, Plus, Sparkles, Twitter, Wand2, XCircle, Youtube, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDate, formatDateTime, formatMonthYear, getIsoWeekInfo } from '@/lib/dates';
import Header from './components/Header';
import Footer from './components/Footer';
import { PageTransition } from './components/Animations';
import PriorityActions from './components/PriorityActions';
import ProductionPipeline from './components/ProductionPipeline';
import ProductionsList, { Production } from './components/ProductionsList';
import AutomationRuns, { AutomationRun } from './components/AutomationRuns';
import OnboardingTour from './components/dashboard/OnboardingTour';
import DashboardContextCards from './components/dashboard/DashboardContextCards';
import DashboardWeeklyStatusCard from './components/dashboard/DashboardWeeklyStatusCard';
import DashboardWeekDisciplineCard from './components/dashboard/DashboardWeekDisciplineCard';
import DashboardIntegrationsPanel from './components/dashboard/DashboardIntegrationsPanel';
import DashboardReconcileDrawer from './components/dashboard/DashboardReconcileDrawer';
import CreateProductionModal from './components/dashboard/CreateProductionModal';
import PublishProductionModal from './components/dashboard/PublishProductionModal';
import { useAuth, useAuthFetch } from './contexts/AuthContext';
import { useLocale } from './contexts/LocaleContext';
import { IMPACT_METRICS } from '@/app/content/metrics';
import { useToast } from './contexts/ToastContext';
import { getDashboardCopy, getStageLabels } from './content/dashboard';
import { getLandingCopy } from './content/landing';
import { generatePriorityActions, getChecklistStatus } from './content/dashboardUtils';
import type { Channel, DashboardTab, DisciplineWeekly, PipelineStats, PriorityAction, WeeklyGoalResponse, WeeklyStatus, YoutubeReconcileWeekly } from './content/dashboardTypes';
import { WEEKLY_STATUS_STYLES, RECONCILE_SLOT_STYLES } from '@/app/content/status/weekly';
import useDialogFocus from './hooks/useDialogFocus';
import { useDashboardDataLoader } from './hooks/useDashboardDataLoader';

export function DashboardContent() {
  const { isAuthenticated, logout } = useAuth();
  const { locale } = useLocale();
  const authFetch = useAuthFetch();
  const { addToast } = useToast();
  const dashboardCopy = useMemo(() => getDashboardCopy(locale), [locale]);
  const stageLabels = useMemo(() => getStageLabels(locale), [locale]);
  const tourSteps = dashboardCopy.tour.steps;
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams?.toString() ?? '';
  const channelIdParam = searchParams?.get('channelId') ?? '';
  const productionIdParam = searchParams?.get('productionId') ?? '';
  const shouldOpenNewModal = searchParams?.get('new') === '1';
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
  const [reconcileError, setReconcileError] = useState<string | null>(null);
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
  const [focusSearch, setFocusSearch] = useState('');
  const [selectedProductionIds, setSelectedProductionIds] = useState<string[]>([]);
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
  const autoFetchKeyRef = useRef<string>('');
  const fallbackIso = useMemo(() => getIsoWeekInfo(new Date()), []);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSlot, setDrawerSlot] = useState<'tue' | 'fri' | null>(null);
  const [focusOpen, setFocusOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showStartCard, setShowStartCard] = useState(false);

  const resolveReconcileError = useCallback((code: string | null) => {
    if (!code) return null;
    if (code === 'youtube_auth_invalid') {
      return { message: dashboardCopy.reconcile.authInvalid, actionLabel: dashboardCopy.reconcile.authInvalidAction, actionHref: '/configuracion' };
    }
    if (code === 'youtube_refresh_missing') {
      return { message: dashboardCopy.reconcile.refreshMissing, actionLabel: dashboardCopy.reconcile.refreshMissingAction, actionHref: '/channels' };
    }
    if (code === 'youtube_rate_limited') {
      return { message: dashboardCopy.reconcile.rateLimited, actionLabel: '', actionHref: '' };
    }
    if (code === 'youtube_unavailable') {
      return { message: dashboardCopy.reconcile.unavailable, actionLabel: '', actionHref: '' };
    }
    if (code === 'youtube_channel_not_found') {
      return { message: dashboardCopy.reconcile.channelNotFound, actionLabel: dashboardCopy.reconcile.channelNotFoundAction, actionHref: '/channels' };
    }
    return { message: dashboardCopy.reconcile.generic, actionLabel: dashboardCopy.reconcile.genericAction, actionHref: '/channels' };
  }, [dashboardCopy.reconcile]);

  useDialogFocus(modalRef, showModal);
  useDialogFocus(publishRef, Boolean(publishTarget));

  useEffect(() => {
    if (!isAuthenticated) return;
    const storedChannel = typeof window !== 'undefined' ? window.localStorage.getItem('cronostudio.channelId') : null;
    const initial = channelIdParam || storedChannel || '';
    if (initial) {
      setSelectedChannelId(initial);
    }
  }, [isAuthenticated, channelIdParam, searchParamsKey]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (productionIdParam) {
      setFocusedProductionId(productionIdParam);
      setFocusOpen(true);
    }
  }, [isAuthenticated, productionIdParam, searchParamsKey]);

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

  const { fetchData } = useDashboardDataLoader({
    isAuthenticated,
    authFetch,
    selectedChannelId,
    setSelectedChannelId,
    searchParamsKey,
    router,
    fallbackIso,
    logout,
    addToast,
    toasts: {
      sessionExpired: dashboardCopy.toasts.sessionExpired,
      weeklyStatusError: dashboardCopy.toasts.weeklyStatusError,
    },
    setChannels,
    setProductions,
    setPipelineStats,
    setIdeas,
    setRuns,
    setWeeklyStatus,
    setWeeklyActions,
    setWeeklyError,
    setWeeklyGoal,
    setDisciplineWeekly,
    setReconcileWeekly,
    setReconcileError,
    setLoading,
    autoFetchKeyRef,
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    const hasChannel = channels.length > 0;
    const hasIdeas = ideas.length > 0;
    const shouldShow = !hasChannel || !hasIdeas;
    setShowStartCard(shouldShow);
  }, [isAuthenticated, channels.length, ideas.length]);

  useEffect(() => {
    if (shouldOpenNewModal) {
      setShowModal(true);
    }
  }, [shouldOpenNewModal, searchParamsKey]);

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
      addToast(dashboardCopy.toasts.created, 'success');
      } else {
      addToast(dashboardCopy.toasts.createFailed, 'error');
      }
    } catch (e) {
      addToast(dashboardCopy.toasts.createError, 'error');
      console.error('[dashboard] update failed', e);
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
        throw new Error(data.error || dashboardCopy.toasts.publishMarkError);
      }
      setPublishTarget(null);
      setPublishUrl('');
      setPublishPlatformId('');
      setPublishPlatformTouched(false);
      fetchData();
      addToast(dashboardCopy.toasts.publishMarked, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : dashboardCopy.toasts.publishMarkError, 'error');
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
      addToast(dashboardCopy.toasts.selectChannelFirst, 'error');
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
        throw new Error(data.error || dashboardCopy.toasts.generatePlanError);
      }
      addToast(dashboardCopy.toasts.planGenerated, 'success');
      fetchData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : dashboardCopy.toasts.generatePlanError, 'error');
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

  const resolveStageLabel = (status: string) => stageLabels[status as keyof PipelineStats] ?? status;
  const nextConditionText = weeklyStatus?.nextCondition?.label ?? dashboardCopy.weeklyStatus.noNext;
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
    monday: dashboardCopy.labels.mondayShort,
    tuesday: dashboardCopy.labels.tuesdayShort,
    wednesday: dashboardCopy.labels.wednesdayShort,
    thursday: dashboardCopy.labels.thursdayShort,
    friday: dashboardCopy.labels.fridayShort,
    saturday: dashboardCopy.labels.saturdayShort,
    sunday: dashboardCopy.labels.sundayShort,
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
  const fallbackWeeks: NonNullable<WeeklyStatus['last4Weeks']> = Array.from({ length: 4 }, () => ({
    isoYear: 0,
    isoWeek: 0,
    status: 'EN_RIESGO',
  }));
  const disciplineStatus = disciplineWeekly?.status ?? 'OK';
  const disciplineStyle = WEEKLY_STATUS_STYLES[disciplineStatus] ?? WEEKLY_STATUS_STYLES.OK;
  const disciplineCount = disciplineWeekly?.scoreboard.count ?? 0;
  const disciplineTarget = disciplineWeekly?.scoreboard.target ?? 2;
  const disciplineMissing = Math.max(disciplineTarget - disciplineCount, 0);
  const disciplineStreakCurrent = disciplineWeekly?.streak.current ?? 0;
  const disciplineStreakBest = disciplineWeekly?.streak.best ?? 0;
  const publishedTotal = pipelineStats.published || 0;
  const estimatedHoursSaved = publishedTotal * IMPACT_METRICS.hoursSavedPerVideo;
  const ideaToScriptRate = pipelineStats.idea > 0
    ? Math.round((pipelineStats.scripting / pipelineStats.idea) * 100)
    : 0;
  const weeklyCompletion = weeklyTarget > 0
    ? Math.round((publishedCount / weeklyTarget) * 100)
    : 0;
  const reconcileMessage = resolveReconcileError(reconcileError);

  const slotConfig = [
    { key: 'tue' as const, label: dashboardCopy.labels.tuesdayShort },
    { key: 'fri' as const, label: dashboardCopy.labels.fridayShort },
  ];

  const slotStatus = (slot: 'tue' | 'fri') => {
    const reconcile = reconcileWeekly?.reconciliation[slot];
    if (reconcile === 'ok') return RECONCILE_SLOT_STYLES.ok;
    if (reconcile === 'missing_publish_event') return RECONCILE_SLOT_STYLES.missing_publish_event;
    if (reconcile === 'missing_youtube_video') return RECONCILE_SLOT_STYLES.missing_youtube_video;
    return RECONCILE_SLOT_STYLES.pending;
  };

  const registerNeedsAttention = disciplineMissing > 0 ||
    (reconcileWeekly?.reconciliation.tue === 'missing_publish_event' || reconcileWeekly?.reconciliation.fri === 'missing_publish_event');

  const drawerLabel = drawerSlot === 'tue' ? dashboardCopy.labels.tuesday : drawerSlot === 'fri' ? dashboardCopy.labels.friday : '';
  const drawerEvidence = drawerSlot ? reconcileWeekly?.youtubeEvidence[drawerSlot] : null;
  const drawerPublish = drawerSlot ? reconcileWeekly?.publishEvents[drawerSlot] : null;
  const drawerReconcile = drawerSlot ? reconcileWeekly?.reconciliation[drawerSlot] : null;
  const drawerHasAction = drawerReconcile === 'missing_publish_event';

  const plannedDays = useMemo(() => {
    const map = { tue: dashboardCopy.labels.pending, fri: dashboardCopy.labels.pending } as Record<'tue' | 'fri', string>;
    const planned = weeklyStatus?.plannedProductions || [];
    planned.forEach((item) => {
      if (item.day === 'tuesday') map.tue = dashboardCopy.labels.planned;
      if (item.day === 'friday') map.fri = dashboardCopy.labels.planned;
    });
    return map;
  }, [weeklyStatus?.plannedProductions, dashboardCopy.labels.pending, dashboardCopy.labels.planned]);

  const nextStepCopy = useMemo(() => {
    if (reconcileWeekly?.reconciliation.tue === 'missing_publish_event' || reconcileWeekly?.reconciliation.fri === 'missing_publish_event') {
      return { label: dashboardCopy.messages.missingYoutubeRegistrations, action: dashboardCopy.actions.register };
    }
    if (disciplineMissing > 0) {
      const publicationWord = disciplineMissing > 1 ? dashboardCopy.messages.publicationPlural : dashboardCopy.messages.publicationSingular;
      return {
        label: `${dashboardCopy.messages.missingPublicationsPrefix} ${disciplineMissing} ${publicationWord} ${dashboardCopy.messages.missingPublicationsSuffix}`,
        action: dashboardCopy.actions.register,
      };
    }
    return { label: dashboardCopy.messages.weekCompletedPlanNext, action: dashboardCopy.actions.plan };
  }, [disciplineMissing, reconcileWeekly, dashboardCopy.messages, dashboardCopy.actions]);

  const activeProductions = productions.filter((production) => production.status !== 'published');
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
  const focusOptions = useMemo(() => {
    return activeProductions.map((production) => ({
      id: production.id,
      title: production.title,
    }));
  }, [activeProductions]);

  const buildAiUrl = (profile: string, params: Record<string, string | null | undefined>) => {
    const search = new URLSearchParams();
    search.set('profile', profile);
    Object.entries(params).forEach(([key, value]) => {
      if (value) search.set(key, value);
    });
    return `/ai?${search.toString()}`;
  };

  const handleQuickPublish = async (targetDay: 'tuesday' | 'friday') => {
    if (!selectedChannelId) {
      addToast(dashboardCopy.toasts.selectChannelFirst, 'error');
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
        throw new Error(data.error || dashboardCopy.toasts.registerPublishError);
      }
      addToast(dashboardCopy.toasts.scheduled, 'success');
      fetchData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : dashboardCopy.toasts.registerPublishError, 'error');
    } finally {
      setQuickPublishSubmitting(false);
    }
  };

  const handleRegisterFromYoutube = async (slot: 'tue' | 'fri') => {
    if (!selectedChannelId || !reconcileWeekly) {
      addToast(dashboardCopy.toasts.selectChannelFirst, 'error');
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
        throw new Error(data.error || dashboardCopy.toasts.registerPublishError);
      }
      addToast(dashboardCopy.toasts.registerFromYoutubeSuccess, 'success');
      fetchData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : dashboardCopy.toasts.registerPublishError, 'error');
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

  const handleDockRegister = useCallback(() => {
    openDrawerForSlot(nextSlot);
  }, [nextSlot]);

  const handleDockPlan = useCallback(() => {
    setActiveTab('calendar');
    if (reduceMotion) {
      calendarRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
      calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [reduceMotion]);

  const nextAction = useMemo(() => {
    if (!focusProduction) {
      return {
        label: dashboardCopy.messages.noActiveProductions,
        action: dashboardCopy.actions.createContent,
        onClick: () => setShowModal(true),
      };
    }
    if (focusProduction && focusChecklist) {
      if (!focusChecklist.scriptReady) {
        return {
          label: dashboardCopy.prompts.scriptMissing,
          action: dashboardCopy.actions.generateScript,
          onClick: () => router.push(buildAiUrl('script_architect', {
            ideaId: focusProduction.idea_id ?? null,
            channelId: focusProduction.channel_id ?? null,
          })),
        };
      }
      if (!focusChecklist.seoReady) {
        return {
          label: dashboardCopy.prompts.seoMissing,
          action: dashboardCopy.actions.generateSeo,
          onClick: () => router.push(buildAiUrl('titles_thumbs', {
            ideaId: focusProduction.idea_id ?? null,
            scriptId: focusProduction.script_id ?? null,
            channelId: focusProduction.channel_id ?? null,
          })),
        };
      }
      if (!focusChecklist.thumbnailReady) {
        return {
          label: dashboardCopy.prompts.thumbnailMissing,
          action: dashboardCopy.actions.goToThumbnails,
          onClick: () => router.push(`/thumbnails${focusProduction.channel_id ? `?channelId=${focusProduction.channel_id}` : ''}`),
        };
      }
      if (!focusChecklist.published) {
        return {
          label: dashboardCopy.prompts.readyToPublish,
          action: dashboardCopy.actions.markPublished,
          onClick: () => setPublishTarget(focusProduction),
        };
      }
    }

    return {
      label: nextStepCopy.label,
      action: nextStepCopy.action,
      onClick: nextStepCopy.action === dashboardCopy.actions.register ? handleDockRegister : handleDockPlan,
    };
  }, [focusProduction, focusChecklist, nextStepCopy, router, handleDockRegister, handleDockPlan, dashboardCopy.prompts, dashboardCopy.actions, dashboardCopy.messages.noActiveProductions]);

  const stageCtas = useMemo(() => {
    if (!focusProduction) return {};
    const stageKey = focusProduction.status as keyof PipelineStats;
    return {
      [stageKey]: {
        label: nextAction.action,
        onClick: nextAction.onClick,
      },
    } as Partial<Record<keyof PipelineStats, { label: string; onClick: () => void }>>;
  }, [focusProduction, nextAction]);

  const handleFocusSearch = (value: string) => {
    setFocusSearch(value);
    if (!value) {
      setFocusedProductionId(null);
      return;
    }
    const direct = focusOptions.find((option) => option.id === value);
    if (direct) {
      setFocusedProductionId(direct.id);
      return;
    }
    const match = focusOptions.find((option) => option.title.toLowerCase() === value.toLowerCase());
    if (match) {
      setFocusedProductionId(match.id);
    }
  };

  const toggleProductionSelection = (id: string) => {
    setSelectedProductionIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]
    );
  };

  const clearProductionSelection = () => setSelectedProductionIds([]);

  const bulkUpdateProductions = async (status: string) => {
    if (selectedProductionIds.length === 0) return;
    try {
      await Promise.all(selectedProductionIds.map((id) => authFetch(`/api/productions?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })));
      clearProductionSelection();
      fetchData();
      addToast(dashboardCopy.toasts.updatedProductions, 'success');
    } catch {
      addToast(dashboardCopy.toasts.updateProductionsError, 'error');
    }
  };

  const bulkUpdateTargetDate = async (date: string) => {
    if (selectedProductionIds.length === 0) return;
    try {
      await Promise.all(selectedProductionIds.map((id) => authFetch(`/api/productions?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify({ targetDate: date || null }),
      })));
      clearProductionSelection();
      fetchData();
      addToast(dashboardCopy.toasts.updatedTargetDate, 'success');
    } catch {
      addToast(dashboardCopy.toasts.updateTargetDateError, 'error');
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
    if (tourStep >= tourSteps.length - 1) {
      handleTourClose();
      return;
    }
    setTourStep((step) => step + 1);
  };

  const handleTourBack = () => {
    setTourStep((step) => Math.max(step - 1, 0));
  };

  const priorityActions = weeklyStatus ? weeklyActions : generatePriorityActions(productions, dashboardCopy);
  const publishChecklist = publishTarget ? getChecklistStatus(publishTarget) : null;
  const publishMissing = publishChecklist
    ? [
        !publishChecklist.scriptReady ? dashboardCopy.cards.scriptReady : null,
        !publishChecklist.seoReady ? dashboardCopy.cards.seoApproved : null,
        !publishChecklist.thumbnailReady ? dashboardCopy.cards.thumbnailApproved : null,
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
        throw new Error(data.error || dashboardCopy.toasts.scheduleError);
      }
      addToast(dashboardCopy.toasts.scheduled, 'success');
      setScheduleProductionId('');
      setScheduleDate('');
      fetchData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : dashboardCopy.toasts.scheduleError, 'error');
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
        throw new Error(data.error || dashboardCopy.toasts.cancelError);
      }
      addToast(dashboardCopy.toasts.canceled, 'success');
      fetchData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : dashboardCopy.toasts.cancelError, 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />
      <PageTransition className="flex-1">
          <main className="w-full max-w-full px-4 sm:px-6 lg:px-12 py-6 sm:py-8 pb-24 lg:pb-8">
            <datalist id="focus-productions">
              {focusOptions.map((option) => (
                <option key={option.id} value={option.title} />
              ))}
            </datalist>
            <DashboardContextCards
              dashboardCopy={dashboardCopy}
              weekLabel={weekLabel}
              goalData={goalData}
              weeklyTarget={weeklyTarget}
              goalDays={goalDays}
              publishedCount={publishedCount}
              weeklyError={weeklyError}
              reconcileMessage={reconcileMessage}
              isDefaultChannel={isDefaultChannel}
              channelName={channelName}
              selectedChannelId={selectedChannelId}
              channels={channels}
              onChannelChange={handleChannelChange}
              onRetryWeeklyStatus={() => fetchData()}
              shouldShowAutoPlanCard={weeklyStatus?.planGenerated === false || Boolean(weeklyError)}
              onGeneratePlan={handleGeneratePlan}
              planSubmitting={planSubmitting}
              showStartCard={showStartCard}
            />

            <motion.div
              className="surface-card glow-hover p-5 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-yellow-400/90">{dashboardCopy.cards.impactTitle}</p>
                  <p className="text-sm text-slate-300">{dashboardCopy.cards.impactSubtitle}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{dashboardCopy.cards.impactPublished}</p>
                    <p className="mt-1 text-lg font-semibold text-white">{publishedTotal}</p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{dashboardCopy.cards.impactEstimatedSavings}</p>
                    <p className="mt-1 text-lg font-semibold text-white">{estimatedHoursSaved}h</p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{dashboardCopy.cards.impactStreak}</p>
                    <p className="mt-1 text-lg font-semibold text-white">{streakCurrent} / {streakBest} {dashboardCopy.cards.impactWeeks}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="surface-card glow-hover p-5 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-yellow-400/90">{dashboardCopy.cards.kpisTitle}</p>
                  <p className="text-sm text-slate-300">{dashboardCopy.cards.kpisSubtitle}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{dashboardCopy.cards.kpiIdeaToScript}</p>
                    <p className="mt-1 text-lg font-semibold text-white">{ideaToScriptRate}%</p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{dashboardCopy.cards.kpiWeeklyCompletion}</p>
                    <p className="mt-1 text-lg font-semibold text-white">{weeklyCompletion}%</p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{dashboardCopy.cards.kpiActive}</p>
                    <p className="mt-1 text-lg font-semibold text-white">{activeProductions.length}</p>
                  </div>
                </div>
              </div>
            </motion.div>

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
                    {dashboardCopy.header.tag}
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-3">
                    {dashboardCopy.header.title}
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl">
                    {dashboardCopy.header.subtitle}
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
            {dashboardCopy.fab.label}
                  </motion.button>
                  <button
                    type="button"
                    onClick={handleTourStart}
                    className="hidden sm:inline-flex items-center justify-center gap-2 rounded-lg border border-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 hover:border-yellow-400/60"
                    title={dashboardCopy.common.guideMe}
                  >
                    {dashboardCopy.common.guideMe}
                  </button>
                </div>
              </div>
            </motion.div>

            <div className="mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar">
              {([
                { key: 'production', label: dashboardCopy.tabs.production },
                { key: 'calendar', label: dashboardCopy.tabs.calendar },
                { key: 'backlog', label: dashboardCopy.tabs.backlog },
                { key: 'integrations', label: dashboardCopy.labels.integrations },
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
                      stageCtas={stageCtas}
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
                    <DashboardWeekDisciplineCard
                      dashboardCopy={dashboardCopy}
                      reduceMotion={reduceMotion}
                      last4Weeks={last4Weeks}
                      fallbackWeeks={fallbackWeeks}
                      streakCurrent={streakCurrent}
                      streakBest={streakBest}
                      disciplineWeekly={disciplineWeekly}
                      weekLabel={weekLabel}
                      disciplineTarget={disciplineTarget}
                      disciplineStyle={disciplineStyle}
                      disciplineStatus={disciplineStatus}
                      disciplineCount={disciplineCount}
                      disciplineMissing={disciplineMissing}
                      disciplineStreakCurrent={disciplineStreakCurrent}
                      disciplineStreakBest={disciplineStreakBest}
                      slotConfig={slotConfig}
                      slotStatus={slotStatus}
                      openDrawerForSlot={openDrawerForSlot}
                      focusOpen={focusOpen}
                      setFocusOpen={setFocusOpen}
                      focusSearch={focusSearch}
                      handleFocusSearch={handleFocusSearch}
                      focusProduction={focusProduction}
                      resolveStageLabel={resolveStageLabel}
                      nextAction={nextAction}
                      nextSlot={nextSlot}
                      plannedDays={plannedDays}
                      handleDockPlan={handleDockPlan}
                      setActiveTab={setActiveTab}
                    />

                    <DashboardWeeklyStatusCard
                      dashboardCopy={dashboardCopy}
                      weeklyStatus={weeklyStatus}
                      nextConditionText={nextConditionText}
                      nextConditionDue={nextConditionDue}
                    />

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
                          <span className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">{dashboardCopy.pipeline.ideasActive}</span>
                          <button
                            type="button"
                            onClick={() => setActiveStage(null)}
                            className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-300 hover:border-yellow-400/60"
                          >
                            {stageLabels.idea}
                            <span aria-hidden="true">×</span>
                          </button>
                        </div>
                          <span className="text-xs text-slate-400">{filteredIdeas.length} {dashboardCopy.pipeline.ideasCountLabel}</span>
                      </div>
                        <div className="divide-y divide-gray-800/50">
                          {filteredIdeas.length === 0 ? (
                          <div className="px-4 sm:px-5 py-6 text-slate-300">
                            <p className="mb-3">{dashboardCopy.pipeline.noIdeas}</p>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <button
                                type="button"
                                onClick={() => router.push(`/ai?profile=evergreen_ideas${selectedChannelId ? `&channelId=${selectedChannelId}` : ''}`)}
                                className="rounded-lg bg-yellow-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                              >
                                 {dashboardCopy.actions.generate}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="rounded-lg border border-gray-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300"
                              >
                                 {dashboardCopy.actions.createContent}
                              </button>
                            </div>
                          </div>
                        ) : (
                          filteredIdeas.slice(0, 6).map((idea) => (
                            <div key={idea.id} className="px-4 sm:px-5 py-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-white font-medium">{idea.title}</p>
                                   <p className="text-xs text-slate-400">{dashboardCopy.cards.priority} {idea.priority}</p>
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
                      title={activeStage ? dashboardCopy.pipeline.inStage : dashboardCopy.pipeline.active}
                      showCreateButton={false}
                      emptyActions={[
                         { label: dashboardCopy.cards.createProduction, onClick: () => setShowModal(true) },
                        { label: 'Crono', onClick: () => router.push(`/ai${selectedChannelId ? `?channelId=${selectedChannelId}` : ''}`), tone: 'ghost' },
                      ]}
                      selectedIds={selectedProductionIds}
                      onToggleSelection={toggleProductionSelection}
                      onClearSelection={clearProductionSelection}
                      onBulkStatus={bulkUpdateProductions}
                      onBulkTargetDate={bulkUpdateTargetDate}
                    />
                  )}
                  </div>

                  {activeTab === 'production' && (
                    <div className="hidden space-y-4 lg:block lg:sticky lg:top-24">
                      <div className="surface-card glow-hover p-4 sm:p-5">
                        <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">{dashboardCopy.cards.finalChecklist}</div>
                        {focusProduction ? (
                          <div className="mt-3 space-y-2 text-xs text-slate-300">
                            <div className="text-sm text-slate-200 font-semibold truncate">{focusProduction.title}</div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                              <span className="uppercase tracking-[0.2em]">{dashboardCopy.cards.status}</span>
                              <span className="rounded-full border border-gray-800 px-2 py-0.5 text-slate-200">
                                {resolveStageLabel(focusProduction.status)}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span>{focusProduction.channel_name ?? dashboardCopy.labels.noChannel}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                              <span>{dashboardCopy.cards.targetDate}:</span>
                              <span className="text-slate-200">
                                {focusProduction.target_date
                                  ? formatDate(focusProduction.target_date)
                                  : dashboardCopy.labels.noDate}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span>
                                {dashboardCopy.cards.updated} {formatDate(focusProduction.updated_at)}
                              </span>
                            </div>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  {focusChecklist?.scriptReady ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <XCircle className="h-3 w-3 text-slate-500" />}
                                  {dashboardCopy.cards.scriptReady}
                                </span>
                                {!focusChecklist?.scriptReady && (
                                  <Link
                                    href={`/ai?profile=script_architect${focusProduction?.idea_id ? `&ideaId=${focusProduction.idea_id}` : ''}${focusProduction?.channel_id ? `&channelId=${focusProduction.channel_id}` : ''}`}
                                    className="text-emerald-300 hover:text-emerald-200"
                                  >
                                    {dashboardCopy.actions.generate}
                                  </Link>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  {focusChecklist?.seoReady ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <XCircle className="h-3 w-3 text-slate-500" />}
                                  {dashboardCopy.cards.seoApproved}
                                </span>
                                {!focusChecklist?.seoReady && (
                                  <Link
                                    href={`/ai?profile=titles_thumbs${focusProduction?.idea_id ? `&ideaId=${focusProduction.idea_id}` : ''}${focusProduction?.script_id ? `&scriptId=${focusProduction.script_id}` : ''}${focusProduction?.channel_id ? `&channelId=${focusProduction.channel_id}` : ''}`}
                                    className="text-sky-300 hover:text-sky-200"
                                  >
                                    {dashboardCopy.actions.generate}
                                  </Link>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  {focusChecklist?.thumbnailReady ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <XCircle className="h-3 w-3 text-slate-500" />}
                                  {dashboardCopy.cards.thumbnailApproved}
                                </span>
                                {!focusChecklist?.thumbnailReady && (
                                  <Link
                                    href={`/thumbnails${focusProduction?.channel_id ? `?channelId=${focusProduction.channel_id}` : ''}`}
                                    className="text-yellow-300 hover:text-yellow-200"
                                  >
                                    {dashboardCopy.actions.view}
                                  </Link>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  {focusChecklist?.published ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <XCircle className="h-3 w-3 text-slate-500" />}
                                  {dashboardCopy.cards.published}
                                </span>
                                {!focusChecklist?.published && (
                                  <button
                                    type="button"
                                    onClick={() => setPublishTarget(focusProduction)}
                                    className="text-yellow-300 hover:text-yellow-200"
                                  >
                                    {dashboardCopy.actions.markPublished}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 space-y-3 text-xs text-slate-400">
                            <p>{dashboardCopy.cards.noActiveProductions}</p>
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="w-full rounded-lg bg-yellow-400 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                              >
                                {dashboardCopy.actions.createContent}
                              </button>
                              <button
                                type="button"
                                onClick={() => router.push('/ideas?new=1')}
                                className="w-full rounded-lg border border-gray-800 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                              >
                                {dashboardCopy.actions.createIdea}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="surface-card glow-hover p-4 sm:p-5">
                        <div>
                          <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{dashboardCopy.cards.searchProduction}</label>
                          <div className="relative mt-2">
                            <input
                              value={focusSearch}
                              onChange={(event) => handleFocusSearch(event.target.value)}
                              list="focus-productions"
                              placeholder={dashboardCopy.cards.typeTitle}
                              className="w-full rounded-lg border border-gray-800 bg-gray-900/70 px-3 py-2 pr-8 text-xs text-slate-200"
                            />
                            {focusSearch && (
                              <button
                                type="button"
                                onClick={() => handleFocusSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                aria-label={dashboardCopy.cards.clearSearch}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">{dashboardCopy.cards.nextStep}</div>
                        {focusProduction && (
                          <div className="mt-2 text-xs text-slate-400">
                            <p className="truncate">{focusProduction.title}</p>
                            <p className="mt-1 flex flex-wrap items-center gap-2">
                              <span>{focusProduction.channel_name ?? dashboardCopy.labels.noChannel}</span>
                              <span className="text-slate-600">•</span>
                              <span>{resolveStageLabel(focusProduction.status)}</span>
                            </p>
                          </div>
                        )}
                        <p className="mt-3 text-sm text-slate-200">{nextAction.label}</p>
                        <button
                          type="button"
                          onClick={nextAction.onClick}
                          className="mt-4 w-full rounded-lg bg-yellow-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                        >
                          {nextAction.action}
                        </button>
                      </div>

                      <div className="surface-card glow-hover p-4 sm:p-5">
                        <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">{dashboardCopy.labels.verifiedByYoutube}</div>
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
                          {dashboardCopy.cards.openDetail}
                        </button>
                      </div>

                      <div className="surface-card glow-hover p-4 sm:p-5">
                        <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">{dashboardCopy.cards.weeklyPlan}</div>
                        <div className="mt-3 space-y-2 text-xs text-slate-300">
                          <div className="flex items-center justify-between">
                            <span>{dashboardCopy.labels.tuesdayShort}</span>
                            <span>{plannedDays.tue}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>{dashboardCopy.labels.fridayShort}</span>
                            <span>{plannedDays.fri}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleDockPlan}
                          className="mt-4 w-full rounded-lg border border-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                        >
                          {dashboardCopy.cards.goToCalendar}
                        </button>
                      </div>

                      <div className="surface-card glow-hover p-4 sm:p-5">
                        <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">{dashboardCopy.cards.shortcuts}</div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('calendar')}
                            className="rounded-lg border border-gray-800 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
                          >
                            {dashboardCopy.tabs.calendar}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('backlog')}
                            className="rounded-lg border border-gray-800 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
                          >
                            {dashboardCopy.tabs.backlog}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('integrations')}
                            className="rounded-lg border border-gray-800 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
                          >
                            {dashboardCopy.labels.integrations}
                          </button>
                          <button
                            type="button"
                            onClick={handleDockRegister}
                            className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-200"
                          >
                            {dashboardCopy.actions.register}
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
                        <div className="text-center sm:text-left">
                          <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">{dashboardCopy.calendar.title}</div>
                          <p className="text-xs sm:text-sm text-slate-300">{dashboardCopy.calendar.subtitle}</p>
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
                              {dashboardCopy.calendar.month}
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
                              {dashboardCopy.calendar.week}
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
                        {dashboardCopy.calendar.weekdays.map((day) => (
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
                        <div className="text-xs font-semibold text-slate-300 uppercase tracking-[0.2em]">{dashboardCopy.calendar.schedule}</div>
                        <select
                          value={scheduleProductionId}
                          onChange={(event) => setScheduleProductionId(event.target.value)}
                          className="w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white"
                        >
                          <option value="">{dashboardCopy.calendar.selectContent}</option>
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
                            {dashboardCopy.calendar.scheduleAction}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setScheduleProductionId('');
                              setScheduleDate('');
                            }}
                            className="w-full rounded-lg border border-gray-700 px-3 py-2 text-sm text-slate-200 hover:bg-gray-800"
                          >
                            {dashboardCopy.calendar.clear}
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-gray-800 pt-4">
                        <div className="text-xs font-semibold text-slate-300 uppercase tracking-[0.2em] mb-3">{dashboardCopy.calendar.agenda}</div>
                        {selectedDate ? (
                          <div className="space-y-2">
                            {(scheduledByDate.get(selectedDate) || []).length === 0 && (
                              <p className="text-xs text-slate-500">{dashboardCopy.calendar.emptyDay}</p>
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
                                    {dashboardCopy.calendar.reschedule}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUnschedule(production.id)}
                                    className="text-red-300 hover:text-red-200"
                                  >
                                    {dashboardCopy.calendar.cancel}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {upcomingScheduled.length === 0 ? (
                              <p className="text-xs text-slate-500">{dashboardCopy.calendar.emptyUpcoming}</p>
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
                                      {dashboardCopy.calendar.reschedule}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUnschedule(production.id)}
                                      className="text-red-300 hover:text-red-200"
                                    >
                                      {dashboardCopy.calendar.cancel}
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

                  <DashboardIntegrationsPanel dashboardCopy={dashboardCopy} activeTab={activeTab} />
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
            title={dashboardCopy.actionDock.register}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/15 text-[12px] font-bold leading-none">
              +
            </span>
            <span className="min-w-0 truncate">{dashboardCopy.actionDock.register}</span>
          </button>
          <button
            type="button"
            onClick={handleDockPlan}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-800 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
            title={dashboardCopy.actionDock.plan}
          >
            <Sparkles className="h-4 w-4" />
            <span className="min-w-0 truncate">{dashboardCopy.actionDock.plan}</span>
          </button>
          <button
            type="button"
            onClick={handleDockVerify}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-800 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300"
            title={dashboardCopy.actionDock.youtube}
          >
            <span className="min-w-0 truncate">{dashboardCopy.actionDock.youtube}</span>
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
            title={dashboardCopy.actionDock.registerPublication}
          >
            {dashboardCopy.actionDock.register}
          </button>
          <button
            type="button"
            onClick={handleDockPlan}
            className="rounded-lg border border-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 hover:border-yellow-400/50"
            title={dashboardCopy.actionDock.planWeek}
          >
            {dashboardCopy.actionDock.planWeek}
          </button>
          <button
            type="button"
            onClick={handleDockVerify}
            className="rounded-lg border border-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 hover:border-yellow-400/50"
            title={dashboardCopy.actionDock.verifyYoutube}
          >
            {dashboardCopy.actionDock.verifyYoutube}
          </button>
        </div>
      </div>

      <DashboardReconcileDrawer
        open={drawerOpen}
        reduceMotion={Boolean(reduceMotion)}
        dashboardCopy={dashboardCopy}
        drawerLabel={drawerLabel}
        drawerEvidence={drawerEvidence}
        drawerPublish={drawerPublish}
        drawerHasAction={drawerHasAction}
        drawerSlot={drawerSlot}
        reconcileSubmitting={reconcileSubmitting}
        quickPublishSubmitting={quickPublishSubmitting}
        onClose={() => setDrawerOpen(false)}
        onRegisterFromYoutube={handleRegisterFromYoutube}
        onQuickPublish={handleQuickPublish}
      />

      <OnboardingTour
        open={tourOpen}
        stepIndex={tourStep}
        steps={tourSteps}
        labels={dashboardCopy.tour}
        onClose={handleTourClose}
        onNext={handleTourNext}
        onBack={handleTourBack}
        reduceMotion={Boolean(reduceMotion)}
      />
      <Footer />

      <CreateProductionModal
        open={showModal}
        dashboardCopy={dashboardCopy}
        newTitle={newTitle}
        modalRef={modalRef}
        onClose={() => setShowModal(false)}
        onChangeTitle={setNewTitle}
        onCreate={handleCreate}
      />

      <PublishProductionModal
        publishTarget={publishTarget}
        dashboardCopy={dashboardCopy}
        publishRef={publishRef}
        publishMissing={publishMissing}
        publishUrl={publishUrl}
        publishPlatformId={publishPlatformId}
        publishSubmitting={publishSubmitting}
        onClose={() => setPublishTarget(null)}
        onPublish={handlePublish}
        onChangeUrl={(next) => {
          setPublishUrl(next);
          if (!publishPlatformTouched) {
            const extracted = extractYouTubeId(next);
            setPublishPlatformId(extracted);
          }
        }}
        onChangePlatformId={(next) => {
          setPublishPlatformId(next);
          setPublishPlatformTouched(true);
        }}
        onPlatformIdBlur={() => {
          if (!publishUrl && publishPlatformId.trim()) {
            setPublishUrl(`https://www.youtube.com/watch?v=${publishPlatformId.trim()}`);
          }
        }}
      />
    </div>
  );
}

function HomeContent() {
  return <PublicLanding />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex flex-col" />}>
      <HomeContent />
    </Suspense>
  );
}

export function PublicLanding() {
  const { locale } = useLocale();
  const copy = getLandingCopy(locale);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
      </div>
      <Header />
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-10 sm:py-14 relative">
        <section className="grid gap-8 sm:gap-10 lg:gap-12 lg:grid-cols-[1.15fr_0.85fr] items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-yellow-300">
              <Sparkles className="h-4 w-4" />
              {copy.badge}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight">
              {copy.title}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl">
              {copy.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-400 px-5 py-3 text-sm font-semibold text-black w-full sm:w-auto"
              >
                {copy.ctaPrimary}
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-700 px-5 py-3 text-sm font-semibold text-slate-200 w-full sm:w-auto"
              >
                {copy.ctaSecondary}
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {copy.steps.map((step, index) => (
                <div key={step.title} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                  <div className="text-xs text-yellow-300">{locale === 'en' ? 'Step' : 'Paso'} {index + 1}</div>
                  <div className="mt-2 text-sm font-semibold text-white">{step.title}</div>
                  <div className="mt-2 text-xs text-slate-400">{step.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Wand2 className="h-5 w-5 text-yellow-300" />
                {copy.purpose.title}
              </div>
              <p className="mt-3 text-sm text-slate-400">
                {copy.purpose.description}
              </p>
              <div className="mt-4 grid gap-3">
                {copy.purpose.bullets.map((bullet) => (
                  <div key={bullet} className="rounded-lg border border-gray-800 bg-gray-900/50 p-3 text-sm text-slate-300">
                    {bullet}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Zap className="h-5 w-5 text-yellow-300" />
                {copy.howItWorks.title}
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                {copy.howItWorks.items.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-6">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{copy.sections.integrations}</div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-800 px-3 py-1">
                  <Youtube className="h-4 w-4 text-red-400" /> {copy.integrations[0]}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-800 px-3 py-1">
                  <Instagram className="h-4 w-4 text-pink-400" /> {copy.integrations[1]}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-800 px-3 py-1">
                  <Twitter className="h-4 w-4 text-sky-400" /> {copy.integrations[2]}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-800 px-3 py-1">
                  <Linkedin className="h-4 w-4 text-blue-400" /> {copy.integrations[3]}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-800 px-3 py-1">
                  <Music2 className="h-4 w-4 text-emerald-400" /> {copy.integrations[4]}
                </span>
              </div>
            </div>
          </div>
          </section>

          <section className="mt-10 sm:mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
            <div className="min-w-0 space-y-6">
              <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-6">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{copy.sections.testimonials}</div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:hidden">
                  {copy.testimonials.map((item) => (
                    <div key={item.name} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={item.photo}
                          alt={item.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-semibold text-white">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.role}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-slate-300">“{item.quote}”</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 hidden lg:block">
                  <div className="relative overflow-hidden w-full">
                    <div className="testimonial-track max-w-full">
                      {[...Array(2)].flatMap(() => copy.testimonials).map((item, index) => (
                        <div key={`${item.name}-${index}`} className="testimonial-card rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                          <div className="flex items-center gap-3">
                            <Image
                              src={item.photo}
                              alt={item.name}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                            <div>
                              <p className="text-sm font-semibold text-white">{item.name}</p>
                              <p className="text-xs text-slate-500">{item.role}</p>
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-slate-300">“{item.quote}”</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-6">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{copy.sections.newsletter}</div>
                <p className="mt-2 text-sm text-slate-300">
                  {copy.newsletter.description}
                </p>
                <p className="mt-2 text-xs text-slate-500">{copy.newsletter.note}</p>
                <form className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    name="email"
                    placeholder={copy.newsletter.emailPlaceholder}
                    className="w-full rounded-lg border border-gray-700 bg-gray-950/60 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
                  />
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg bg-yellow-400 px-5 py-3 text-sm font-semibold text-black"
                  >
                    {copy.newsletter.subscribe}
                  </button>
                </form>
              </div>
            </div>
            <div className="min-w-0 rounded-2xl border border-gray-800 bg-gray-950/70 p-6">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{copy.sections.pricing}</div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-yellow-400/40 bg-yellow-400/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">{copy.pricing.creatorPlanName}</div>
                    <div className="text-sm text-yellow-300">{copy.pricing.recommended}</div>
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-white">$29<span className="text-sm text-slate-400">{copy.pricing.creatorPeriod}</span></div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {copy.pricing.creatorFeatures.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <Link href="/register" className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black">
                    {copy.pricing.creatorCta}
                  </Link>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                  <div className="text-sm font-semibold text-white">{copy.pricing.starterPlanName}</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{copy.pricing.starterPrice}</div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {copy.pricing.starterFeatures.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <Link href="/register" className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-slate-200">
                    {copy.pricing.starterCta}
                  </Link>
                </div>
              </div>
            </div>
          </section>

        </main>
      <Footer />
    </div>
  );
}
