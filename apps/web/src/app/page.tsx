'use client';

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Linkedin, Music2, Plus, Sparkles, Twitter } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
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
  type: 'script' | 'seo' | 'thumbnail' | 'short' | 'publish';
  title: string;
  productionTitle: string;
  productionId: string;
  urgency: 'high' | 'medium' | 'low';
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

function DashboardContent() {
  const { isAuthenticated } = useAuth();
  const authFetch = useAuthFetch();
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const [productions, setProductions] = useState<Production[]>([]);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats>({
    idea: 0, scripting: 0, recording: 0, editing: 0, shorts: 0, publishing: 0, published: 0
  });
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [ideas, setIdeas] = useState<{ id: string; title: string; status: string; priority: number }[]>([]);
  const [activeStage, setActiveStage] = useState<keyof PipelineStats | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [scheduleProductionId, setScheduleProductionId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useDialogFocus(modalRef, showModal);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      const [productionsRes, ideasRes, runsRes] = await Promise.all([
        authFetch('/api/productions?stats=true', { signal }),
        authFetch('/api/ideas', { signal }),
        authFetch('/api/automation-runs', { signal })
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
    } catch (e) {
      if (signal?.aborted) return;
      console.error('Error:', e);
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated, fetchData]);

  useEffect(() => {
    if (searchParams?.get('new') === '1') {
      setShowModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!showModal) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showModal]);

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

  const stageLabels: Record<keyof PipelineStats, string> = STAGE_LABELS;

  const priorityActions = generatePriorityActions(productions);
  const activeProductions = productions.filter(p => p.status !== 'published');
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <PageTransition className="flex-1">
        <main className="w-full px-4 md:px-8 lg:px-12 py-8">
            {/* Header */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-yellow-400/90 mb-3">
                    <Sparkles className="w-4 h-4" />
                    {DASHBOARD_COPY.header.tag}
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-3">
                    {DASHBOARD_COPY.header.title}
                  </h1>
                  <p className="text-base md:text-lg text-slate-300 max-w-2xl">
                    {DASHBOARD_COPY.header.subtitle}
                  </p>
                </div>
                <motion.button
                  onClick={() => setShowModal(true)}
                  className="inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-black rounded-lg sm:w-auto"
                  style={{
                    background: 'linear-gradient(135deg, rgba(246, 201, 69, 0.95), rgba(246, 201, 69, 0.7))',
                    boxShadow: '0 10px 20px rgba(246, 201, 69, 0.22)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
          <Plus className="w-4 h-4" />
          {DASHBOARD_COPY.fab.label}
                </motion.button>
              </div>
            </motion.div>

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
                <ProductionPipeline
                  stats={pipelineStats}
                  activeStage={activeStage}
                  onStageClick={(stage) => setActiveStage((current) => (current === stage ? null : stage))}
                />

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 items-start">
                  <div className="space-y-5">
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
                      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/60">
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
                          <div className="px-5 py-6 text-slate-300">{DASHBOARD_COPY.pipeline.noIdeas}</div>
                        ) : (
                          filteredIdeas.slice(0, 6).map((idea) => (
                            <div key={idea.id} className="px-5 py-4">
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
                      onCreateNew={() => setShowModal(true)}
                      filterLabel={activeStage ? stageLabels[activeStage] : null}
                      onClearFilter={() => setActiveStage(null)}
                      title={activeStage ? DASHBOARD_COPY.pipeline.inStage : DASHBOARD_COPY.pipeline.active}
                      showCreateButton={false}
                    />
                  )}
                  </div>

                  <div className="space-y-4">
                    <motion.div
                      className="surface-card glow-hover p-6 min-h-[520px]"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em]">{DASHBOARD_COPY.calendar.title}</div>
                          <p className="text-sm text-slate-300">{DASHBOARD_COPY.calendar.subtitle}</p>
                        </div>
                      <div className="flex items-center gap-2">
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

                      <div className="text-sm font-semibold text-white mb-3 capitalize">
                        {calendarMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      </div>

                      <div className="grid grid-cols-7 gap-2 text-[10px] text-slate-400 mb-2">
                        {DASHBOARD_COPY.calendar.weekdays.map((day) => (
                          <span key={day} className="text-center">{day}</span>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-2">
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
                              className={`relative flex h-9 items-center justify-center rounded-lg text-xs ${
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
                                  <span>{production.target_date?.slice(0, 10)}</span>
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
                                    <span>{production.target_date?.slice(0, 10)}</span>
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

                  <motion.div className="space-y-4">
                    <motion.div
                      className="surface-card glow-hover p-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="text-xs font-semibold text-yellow-400/90 uppercase tracking-[0.2em] mb-4">{DASHBOARD_COPY.social.title}</div>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {DASHBOARD_COPY.social.items.map((item) => {
                          const iconMap: Record<string, JSX.Element> = {
                            Instagram: <Instagram className="w-4 h-4" />,
                            TikTok: <Music2 className="w-4 h-4" />,
                            LinkedIn: <Linkedin className="w-4 h-4" />,
                            X: <Twitter className="w-4 h-4" />,
                          };
                          return (
                            <div key={item.name} className="flex flex-col gap-3 rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
