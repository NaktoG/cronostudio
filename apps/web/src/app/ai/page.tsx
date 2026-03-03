'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clipboard, Check, RefreshCw, History, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackToDashboard from '../components/BackToDashboard';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import useDialogFocus from '../hooks/useDialogFocus';

type Profile = {
  key: string;
  version: number;
  name: string;
  description: string;
};

type Channel = {
  id: string;
  name: string;
};

type Run = {
  id: string;
  channel_id: string | null;
  profile_key: string;
  profile_version: number;
  status: string;
  input_json: unknown;
  output_json: unknown;
  error: string | null;
  created_at: string;
  updated_at: string;
};

type PromptPayload = {
  system: string;
  user: string;
};

const PROFILE_FIELDS: Record<string, { label: string; placeholder: string; key: 'topicSeed' | 'ideaId' | 'scriptId'; required?: boolean }[]> = {
  evergreen_ideas: [
    { key: 'topicSeed', label: 'Tema base (opcional)', placeholder: 'Ej: productividad, marketing, IA' },
  ],
  script_architect: [
    { key: 'ideaId', label: 'Idea ID', placeholder: 'UUID de la idea', required: true },
  ],
  retention_editor: [
    { key: 'scriptId', label: 'Script ID', placeholder: 'UUID del guion', required: true },
  ],
  titles_thumbs: [
    { key: 'ideaId', label: 'Idea ID', placeholder: 'UUID de la idea', required: true },
    { key: 'scriptId', label: 'Script ID (opcional)', placeholder: 'UUID del guion' },
  ],
};

export default function AiStudioPage() {
  const publicModel = process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini';
  const publicMaxTokens = process.env.NEXT_PUBLIC_OPENAI_MAX_OUTPUT_TOKENS || '800';
  const { isAuthenticated } = useAuth();
  const authFetch = useAuthFetch();
  const { addToast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [prompt, setPrompt] = useState<PromptPayload | null>(null);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [outputText, setOutputText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [autoOutput, setAutoOutput] = useState<unknown | null>(null);
  const [autoApplied, setAutoApplied] = useState<Record<string, unknown> | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useDialogFocus(modalRef, Boolean(selectedRun));

  const [formInputs, setFormInputs] = useState({
    topicSeed: '',
    ideaId: '',
    scriptId: '',
  });

  const fetchProfiles = useCallback(async () => {
    try {
      const response = await authFetch('/api/ai/profiles');
      if (!response.ok) return;
      const data = await response.json();
      setProfiles(data.profiles ?? []);
    } catch (error) {
      console.error('Error fetching profiles', error);
    }
  }, [authFetch]);

  const fetchChannels = useCallback(async () => {
    try {
      const response = await authFetch('/api/channels');
      if (!response.ok) return;
      const data = await response.json();
      setChannels(data ?? []);
      if (!selectedChannel && data?.length) {
        setSelectedChannel(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching channels', error);
    }
  }, [authFetch, selectedChannel]);

  const fetchRuns = useCallback(async (channelId: string) => {
    if (!channelId) return;
    try {
      const response = await authFetch(`/api/ai/runs?channelId=${channelId}&limit=20`);
      if (!response.ok) return;
      const data = await response.json();
      setRuns(data.runs ?? []);
    } catch (error) {
      console.error('Error fetching runs', error);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([fetchProfiles(), fetchChannels()]).finally(() => setLoading(false));
  }, [isAuthenticated, fetchProfiles, fetchChannels]);

  useEffect(() => {
    if (!selectedChannel) return;
    fetchRuns(selectedChannel);
  }, [selectedChannel, fetchRuns]);

  const activeFields = useMemo(() => {
    if (!activeProfile) return [];
    return PROFILE_FIELDS[activeProfile.key] ?? [];
  }, [activeProfile]);

  const handleGeneratePrompt = async () => {
    if (!activeProfile) {
      addToast('Selecciona un perfil primero', 'info');
      return;
    }
    if (!selectedChannel) {
      addToast('Selecciona un canal', 'info');
      return;
    }

    const missingField = activeFields.find((field) => field.required && !formInputs[field.key]);
    if (missingField) {
      addToast(`Completa el campo: ${missingField.label}`, 'info');
      return;
    }

    setSubmitting(true);
    try {
      const inputPayload: Record<string, string> = {};
      if (formInputs.topicSeed.trim()) inputPayload.topicSeed = formInputs.topicSeed.trim();
      if (formInputs.ideaId.trim()) inputPayload.ideaId = formInputs.ideaId.trim();
      if (formInputs.scriptId.trim()) inputPayload.scriptId = formInputs.scriptId.trim();

      const response = await authFetch('/api/ai/runs', {
        method: 'POST',
        body: JSON.stringify({
          profileKey: activeProfile.key,
          channelId: selectedChannel,
          input: inputPayload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo generar el prompt');
      }

      const data = await response.json();
      setPrompt(data.prompt);
      setCurrentRunId(data.runId);
      setCurrentStatus(data.status);
      setOutputText('');
      setAutoOutput(null);
      setAutoApplied(null);
      addToast('Prompt generado', 'success');
      fetchRuns(selectedChannel);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Error al generar prompt', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteRun = async () => {
    if (!activeProfile) {
      addToast('Selecciona un perfil primero', 'info');
      return;
    }
    if (!selectedChannel) {
      addToast('Selecciona un canal', 'info');
      return;
    }

    const missingField = activeFields.find((field) => field.required && !formInputs[field.key]);
    if (missingField) {
      addToast(`Completa el campo: ${missingField.label}`, 'info');
      return;
    }

    setExecuting(true);
    try {
      const inputPayload: Record<string, string> = {};
      if (formInputs.topicSeed.trim()) inputPayload.topicSeed = formInputs.topicSeed.trim();
      if (formInputs.ideaId.trim()) inputPayload.ideaId = formInputs.ideaId.trim();
      if (formInputs.scriptId.trim()) inputPayload.scriptId = formInputs.scriptId.trim();

      const response = await authFetch('/api/ai/runs/execute', {
        method: 'POST',
        body: JSON.stringify({
          profileKey: activeProfile.key,
          channelId: selectedChannel,
          input: inputPayload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo ejecutar el run');
      }

      const data = await response.json();
      setAutoOutput(data.output ?? null);
      setAutoApplied(data.applied ?? null);
      setCurrentRunId(data.runId ?? null);
      setCurrentStatus('completed');
      setPrompt(null);
      setOutputText('');
      addToast('Generado y aplicado', 'success');
      fetchRuns(selectedChannel);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Error al ejecutar run', 'error');
    } finally {
      setExecuting(false);
    }
  };

  const handleCopyPrompt = async () => {
    if (!prompt) return;
    const combined = `SYSTEM:\n${prompt.system}\n\nUSER:\n${prompt.user}`;
    try {
      await navigator.clipboard.writeText(combined);
      addToast('Prompt copiado', 'success');
    } catch {
      addToast('No se pudo copiar el prompt', 'error');
    }
  };

  const handleSubmitOutput = async () => {
    if (!currentRunId) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(outputText);
    } catch {
      addToast('JSON inválido. Revisa el formato.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await authFetch(`/api/ai/runs/${currentRunId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ outputJson: parsed }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo guardar el output');
      }
      setCurrentStatus('completed');
      addToast('Resultado guardado', 'success');
      fetchRuns(selectedChannel);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Error al guardar output', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApply = async () => {
    if (!currentRunId) return;
    setApplying(true);
    try {
      const response = await authFetch(`/api/ai/runs/${currentRunId}/apply`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo aplicar');
      }
      const data = await response.json();
      addToast(`Aplicado: ${Object.keys(data.applied ?? {}).join(', ') || 'OK'}`, 'success');
      fetchRuns(selectedChannel);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Error al aplicar', 'error');
    } finally {
      setApplying(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      awaiting_input: 'bg-slate-700 text-slate-200',
      completed: 'bg-emerald-500/20 text-emerald-300',
      failed: 'bg-red-500/20 text-red-300',
    };
    return map[status] ?? 'bg-slate-700 text-slate-200';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24 lg:pb-12 w-full">
          <motion.div
            className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-2">
              <BackToDashboard />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">AI Studio</h2>
                </div>
                <p className="text-sm sm:text-base text-slate-300">Perfiles internos con flujo auto-first y modo manual para control fino.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 justify-start sm:justify-end">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="uppercase tracking-[0.2em] text-[10px] text-slate-500">Modelo</span>
                <span className="text-slate-300">{publicModel}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">Max tokens {publicMaxTokens}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <History className="w-4 h-4" />
                <span>{runs.length} runs</span>
              </div>
              <button
                type="button"
                onClick={() => fetchRuns(selectedChannel)}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-lg border border-gray-800 text-slate-300 hover:text-yellow-300 hover:border-yellow-500/40"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
            <div className="space-y-6 min-w-0">
              <section className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.25)]">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Perfiles disponibles</h3>
                      <p className="text-sm text-slate-400">Selecciona un perfil y completa el input.</p>
                    </div>
                    <select
                      className="bg-gray-900/60 border border-gray-800 text-sm text-slate-200 rounded-lg px-3 py-2"
                      value={selectedChannel}
                      onChange={(event) => setSelectedChannel(event.target.value)}
                      disabled={!channels.length}
                    >
                      {channels.map((channel) => (
                        <option key={channel.id} value={channel.id}>{channel.name}</option>
                      ))}
                    </select>
                  </div>

                  {loading ? (
                    <div className="h-28 rounded-xl bg-gray-900/60 animate-pulse" />
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {profiles.map((profile) => (
                        <button
                          key={profile.key}
                          type="button"
                          onClick={() => {
                            setActiveProfile(profile);
                            setPrompt(null);
                            setCurrentRunId(null);
                            setCurrentStatus(null);
                            setAutoOutput(null);
                            setAutoApplied(null);
                          }}
                          className={`text-left rounded-xl border px-4 py-3 transition-all ${activeProfile?.key === profile.key
                            ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-200'
                            : 'border-gray-800 bg-gray-950/40 text-slate-200 hover:border-yellow-500/40'
                          }`}
                        >
                          <p className="font-semibold text-sm">{profile.name}</p>
                          <p className="text-xs text-slate-400 mt-1">v{profile.version} · {profile.description}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Input del perfil</h3>
                    <p className="text-sm text-slate-400">Completa los datos antes de generar el prompt.</p>
                  </div>
                </div>

                {activeFields.length === 0 ? (
                  <div className="text-sm text-slate-400">Selecciona un perfil para ver los campos.</div>
                ) : (
                  <div className="grid gap-3">
                    {activeFields.map((field) => (
                      <label key={field.key} className="text-sm text-slate-300">
                        <span className="block mb-1">{field.label}{field.required ? ' *' : ''}</span>
                        <input
                          className="w-full rounded-lg border border-gray-800 bg-gray-900/70 px-3 py-2 text-sm text-slate-100"
                          placeholder={field.placeholder}
                          value={formInputs[field.key]}
                          onChange={(event) => setFormInputs((prev) => ({ ...prev, [field.key]: event.target.value }))}
                        />
                      </label>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleGeneratePrompt}
                    disabled={submitting || !activeProfile}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black rounded-lg bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60"
                  >
                    <Sparkles className="w-4 h-4" />
                    {submitting ? 'Generando...' : 'Generar prompt'}
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteRun}
                    disabled={executing || !activeProfile}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black rounded-lg bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60"
                  >
                    <ArrowRight className="w-4 h-4" />
                    {executing ? 'Ejecutando...' : 'Generar y aplicar'}
                  </button>
                  {prompt && (
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-800 text-slate-200 rounded-lg hover:border-yellow-500/40"
                    >
                      <Clipboard className="w-4 h-4" />
                      Copiar prompt
                    </button>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Prompt generado (modo manual)</h3>
                  <p className="text-sm text-slate-400">Copia y pégalo en tu AI. Luego pega el JSON aquí para validar y aplicar.</p>
                </div>
                {prompt ? (
                  <div className="grid gap-3">
                    <textarea
                      className="min-h-[140px] w-full rounded-lg border border-gray-800 bg-gray-900/70 px-3 py-2 text-xs text-slate-200"
                      value={`SYSTEM:\n${prompt.system}\n\nUSER:\n${prompt.user}`}
                      readOnly
                    />
                    <textarea
                      className="min-h-[200px] w-full rounded-lg border border-gray-800 bg-gray-900/70 px-3 py-2 text-xs text-slate-100"
                      placeholder="Pega aqui el JSON de salida"
                      value={outputText}
                      onChange={(event) => setOutputText(event.target.value)}
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSubmitOutput}
                        disabled={submitting || !currentRunId}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black rounded-lg bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60"
                      >
                        <Check className="w-4 h-4" />
                        Validar y guardar
                      </button>
                      <button
                        type="button"
                        onClick={handleApply}
                        disabled={applying || currentStatus !== 'completed'}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-800 text-slate-200 rounded-lg hover:border-yellow-500/40 disabled:opacity-60"
                      >
                        <ArrowRight className="w-4 h-4" />
                        {applying ? 'Aplicando...' : 'Aplicar'}
                      </button>
                      {currentStatus && (
                        <span className={`text-xs px-2 py-1 rounded-full ${statusBadge(currentStatus)}`}>
                          {currentStatus}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">Genera un prompt para continuar.</div>
                )}
              </section>

              <section className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Resultado auto-first</h3>
                  <p className="text-sm text-slate-400">Salida generada y aplicada automaticamente.</p>
                </div>
                {autoOutput ? (
                  <div className="grid gap-3">
                    <pre className="text-xs text-slate-200 bg-gray-900/70 border border-gray-800 rounded-lg p-3 overflow-auto max-h-64">
                      {JSON.stringify(autoOutput, null, 2)}
                    </pre>
                    {autoApplied && (
                      <div className="text-xs text-slate-300">
                        Aplicado: {Object.keys(autoApplied).join(', ') || 'OK'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">Ejecuta “Generar y aplicar” para ver el resultado aqui.</div>
                )}
              </section>
            </div>

            <section className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 space-y-4 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Historial por canal</h3>
                  <p className="text-sm text-slate-400">Ultimas ejecuciones del canal seleccionado.</p>
                </div>
              </div>
              {runs.length === 0 ? (
                <div className="text-sm text-slate-400">Aun no hay runs para este canal.</div>
              ) : (
                <div className="space-y-2">
                  {runs.map((run) => (
                    <button
                      key={run.id}
                      type="button"
                      onClick={() => setSelectedRun(run)}
                      className="w-full text-left rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3 hover:border-yellow-500/40"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{run.profile_key}</p>
                          <p className="text-xs text-slate-500">{new Date(run.created_at).toLocaleString()}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusBadge(run.status)}`}>{run.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
        <Footer />

        <AnimatePresence>
          {selectedRun && (
            <motion.div
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                ref={modalRef}
                className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-xl max-h-[85vh] overflow-y-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-400">{selectedRun.profile_key} · {selectedRun.status}</p>
                    <p className="text-lg font-semibold text-white">Run {selectedRun.id.slice(0, 8)}</p>
                  </div>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-yellow-400"
                    onClick={() => setSelectedRun(null)}
                  >
                    Cerrar
                  </button>
                </div>
                <div className="grid gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-1">Input</p>
                    <pre className="text-xs text-slate-200 bg-gray-900/70 border border-gray-800 rounded-lg p-3 overflow-auto max-h-48">
                      {JSON.stringify(selectedRun.input_json, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-1">Output</p>
                    <pre className="text-xs text-slate-200 bg-gray-900/70 border border-gray-800 rounded-lg p-3 overflow-auto max-h-48">
                      {JSON.stringify(selectedRun.output_json ?? {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
