'use client';

import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clipboard, Check, RefreshCw, History, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackToDashboard from '../components/BackToDashboard';
import ProtectedRoute from '../components/ProtectedRoute';
import CronoChatPanel from '../components/CronoChatPanel';
import { useLocale } from '../contexts/LocaleContext';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useSearchParams } from 'next/navigation';
import { formatDateTime } from '@/lib/dates';
import { IDEA_PRESETS, SCRIPT_STYLE_PRESETS } from '@/app/content/aiPresets';
import { getAiOutputCopy } from '@/app/content/aiOutput';
import { useAiStudio } from '@/app/ai/hooks/useAiStudio';


type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function toText(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <div className="text-sm text-slate-200">{children}</div>
    </div>
  );
}

function renderActionPlan(plan: unknown) {
  if (!Array.isArray(plan)) return null;
  return (
    <ol className="list-decimal list-inside space-y-1">
      {plan.map((item, index) => {
        if (isObject(item)) {
          const step = String(item.step ?? item.action ?? `Paso ${index + 1}`);
          const outcome = item.outcome ? ` — ${String(item.outcome)}` : '';
          return <li key={`${step}-${index}`}>{step}{outcome}</li>;
        }
        return <li key={`${String(item)}-${index}`}>{String(item)}</li>;
      })}
    </ol>
  );
}

function renderEvergreenOutput(output: JsonObject, outputCopy: ReturnType<typeof getAiOutputCopy>) {
  const ranking = Array.isArray(output.nicheRanking) ? output.nicheRanking : [];
  const clusters = Array.isArray(output.channelClusters) ? output.channelClusters : [];
  const roadmap = Array.isArray(output.roadmap) ? output.roadmap : [];
  const automationPlan = isObject(output.automationPlan) ? output.automationPlan : null;
  const compliance = Array.isArray(output.complianceChecks) ? output.complianceChecks : [];
  const ideas = Array.isArray(output.contentIdeas)
    ? output.contentIdeas
    : Array.isArray(output.ideas)
      ? output.ideas
      : [];
  const actionPlanContent = renderActionPlan(output.actionPlan);

  return (
    <div className="space-y-4">
      {ranking.length > 0 && (
        <Section title={outputCopy.nicheRanking}>
          <div className="space-y-2">
            {ranking.map((item, index) => {
              if (!isObject(item)) return null;
              return (
                <div key={`niche-${index}`} className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">{String(item.niche ?? outputCopy.nicheFallback)}</span>
                    {item.score ? <span className="text-xs text-yellow-300">{outputCopy.score} {String(item.score)}</span> : null}
                    {item.risk ? <span className="text-xs text-rose-300">{outputCopy.risk}: {String(item.risk)}</span> : null}
                    {item.monetizationPotential ? (
                      <span className="text-xs text-emerald-300">{outputCopy.monetization}: {String(item.monetizationPotential)}</span>
                    ) : null}
                  </div>
                  {Array.isArray(item.reasons) && item.reasons.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-xs text-slate-300 space-y-1">
                      {item.reasons.map((reason, idx) => (
                        <li key={`reason-${index}-${idx}`}>{String(reason)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}
      {clusters.length > 0 && (
        <Section title={outputCopy.contentClusters}>
          <div className="space-y-2">
            {clusters.map((cluster, index) => {
              if (!isObject(cluster)) return null;
              const topics = Array.isArray(cluster.topics) ? cluster.topics : [];
              return (
                <div key={`cluster-${index}`} className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
                  <p className="text-sm font-semibold text-slate-100">{String(cluster.name ?? outputCopy.clusterFallback)}</p>
                  {cluster.rationale ? (
                    <p className="text-xs text-slate-400 mt-1">{String(cluster.rationale)}</p>
                  ) : null}
                  {topics.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-xs text-slate-300 space-y-1">
                      {topics.map((topic, idx) => (
                        <li key={`topic-${index}-${idx}`}>{String(topic)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}
      {ideas.length > 0 && (
        <Section title={outputCopy.initialIdeas}>
          <div className="space-y-2">
            {ideas.map((idea, index) => {
              if (!isObject(idea)) return null;
              return (
                <div key={`idea-${index}`} className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
                  <p className="text-sm font-semibold text-slate-100">{String(idea.title ?? outputCopy.ideaFallback)}</p>
                  {idea.angle ? <p className="text-xs text-slate-300 mt-1">{outputCopy.angle}: {String(idea.angle)}</p> : null}
                  {idea.hook ? <p className="text-xs text-slate-400 mt-1">{outputCopy.hook}: {String(idea.hook)}</p> : null}
                </div>
              );
            })}
          </div>
        </Section>
      )}
      {roadmap.length > 0 && (
        <Section title={outputCopy.roadmap}>
          <div className="space-y-2">
            {roadmap.map((phase, index) => {
              if (!isObject(phase)) return null;
              const goals = Array.isArray(phase.goals) ? phase.goals : [];
              return (
                <div key={`phase-${index}`} className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
                  <p className="text-sm font-semibold text-slate-100">{String(phase.phase ?? outputCopy.phaseFallback)}</p>
                  {phase.focus ? <p className="text-xs text-slate-400 mt-1">{String(phase.focus)}</p> : null}
                  {goals.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-xs text-slate-300 space-y-1">
                      {goals.map((goal, idx) => (
                        <li key={`goal-${index}-${idx}`}>{String(goal)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}
      {automationPlan && (
        <Section title={outputCopy.automation}>
          <div className="space-y-2">
            {Array.isArray(automationPlan.tools) && (
              <div>
                <p className="text-xs text-slate-400">{outputCopy.tools}</p>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  {automationPlan.tools.map((tool, idx) => (
                    <li key={`tool-${idx}`}>{String(tool)}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(automationPlan.workflow) && (
              <div>
                <p className="text-xs text-slate-400">{outputCopy.workflow}</p>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  {automationPlan.workflow.map((step, idx) => (
                    <li key={`flow-${idx}`}>{String(step)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}
      {compliance.length > 0 && (
        <Section title={outputCopy.complianceAndRisk}>
          <ul className="list-disc list-inside space-y-1">
            {compliance.map((item, index) => (
              <li key={`compliance-${index}`}>{String(item)}</li>
            ))}
          </ul>
        </Section>
      )}
      {actionPlanContent && <Section title={outputCopy.actionPlan}>{actionPlanContent}</Section>}
    </div>
  );
}

function renderScriptOutput(output: JsonObject, outputCopy: ReturnType<typeof getAiOutputCopy>) {
  const development = Array.isArray(output.development) ? output.development : [];
  const hook = toText(output.hook);
  const promise = toText(output.promise);
  const turningPoint = toText(output.turningPoint);
  const closing = toText(output.closing);
  const legacyScript = toText(output.fullScript);
  const actionPlanContent = renderActionPlan(output.actionPlan);
  return (
    <div className="space-y-4">
      {hook && <Section title="Hook">{hook}</Section>}
      {promise && <Section title={outputCopy.promise}>{promise}</Section>}
      {development.length > 0 && (
        <Section title={outputCopy.development}>
          <div className="space-y-2">
            {development.map((block, index) => (
              <p key={`dev-${index}`}>{String(block)}</p>
            ))}
          </div>
        </Section>
      )}
      {turningPoint && <Section title={outputCopy.turningPoint}>{turningPoint}</Section>}
      {closing && <Section title={outputCopy.closing}>{closing}</Section>}
      {legacyScript && !development.length && (
        <Section title={outputCopy.script}>
          <div className="whitespace-pre-wrap text-sm text-slate-100">{legacyScript}</div>
        </Section>
      )}
      {Array.isArray(output.pacingNotes) && output.pacingNotes.length > 0 && (
        <Section title={outputCopy.pacingNotes}>
          <ul className="list-disc list-inside space-y-1">
            {output.pacingNotes.map((note, index) => (
              <li key={`pace-${index}`}>{String(note)}</li>
            ))}
          </ul>
        </Section>
      )}
      {actionPlanContent && <Section title={outputCopy.actionPlan}>{actionPlanContent}</Section>}
    </div>
  );
}

function renderRetentionOutput(output: JsonObject, outputCopy: ReturnType<typeof getAiOutputCopy>) {
  const changes = Array.isArray(output.changes) ? output.changes : [];
  const boosts = Array.isArray(output.retentionBoosts) ? output.retentionBoosts : [];
  const actionPlanContent = renderActionPlan(output.actionPlan);
  const scriptV2 = toText(output.scriptV2);
  const legacyScript = toText(output.revisedScript);
  return (
    <div className="space-y-4">
      {(scriptV2 || legacyScript) && (
        <Section title={outputCopy.optimizedScript}>
          <div className="whitespace-pre-wrap text-sm text-slate-100">{scriptV2 ?? legacyScript}</div>
        </Section>
      )}
      {output.reductionPercent !== undefined && (
        <Section title={outputCopy.estimatedReduction}>{String(output.reductionPercent)}%</Section>
      )}
      {changes.length > 0 && (
        <Section title={outputCopy.changesMade}>
          <ul className="list-disc list-inside space-y-1">
            {changes.map((item, index) => (
              <li key={`change-${index}`}>{String(item)}</li>
            ))}
          </ul>
        </Section>
      )}
      {boosts.length > 0 && (
        <Section title={outputCopy.retentionBoosts}>
          <ul className="list-disc list-inside space-y-1">
            {boosts.map((item, index) => (
              <li key={`boost-${index}`}>{String(item)}</li>
            ))}
          </ul>
        </Section>
      )}
      {actionPlanContent && <Section title={outputCopy.actionPlan}>{actionPlanContent}</Section>}
    </div>
  );
}

function renderTitlesOutput(output: JsonObject, outputCopy: ReturnType<typeof getAiOutputCopy>) {
  const titles = Array.isArray(output.titles) ? output.titles : [];
  const thumbs = Array.isArray(output.thumbnails)
    ? output.thumbnails
    : Array.isArray(output.thumbnailTexts)
      ? output.thumbnailTexts.map((text) => ({ text }))
      : [];
  const combos = Array.isArray(output.topCombos) ? output.topCombos : [];
  const actionPlanContent = renderActionPlan(output.actionPlan);
  return (
    <div className="space-y-4">
      {titles.length > 0 && (
        <Section title={outputCopy.proposedTitles}>
          <ol className="list-decimal list-inside space-y-1">
            {titles.map((item, index) => {
              if (isObject(item)) {
                  const meta = [item.emotion ? `${outputCopy.emotion}: ${String(item.emotion)}` : null, item.curiosityType ? `${outputCopy.curiosity}: ${String(item.curiosityType)}` : null]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <li key={`title-${index}`}>
                    <span className="text-slate-100">{String(item.title)}</span>
                    {meta ? <span className="text-xs text-slate-400"> ({meta})</span> : null}
                  </li>
                );
              }
              return <li key={`title-${index}`}>{String(item)}</li>;
            })}
          </ol>
        </Section>
      )}
      {thumbs.length > 0 && (
        <Section title={outputCopy.thumbnailAngles}>
          <div className="grid gap-2">
            {thumbs.map((item, index) => {
              if (!isObject(item)) return <div key={`thumb-${index}`}>{String(item)}</div>;
              return (
                <div key={`thumb-${index}`} className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
                  <p className="text-sm font-semibold text-slate-100">{String(item.text)}</p>
                  {item.angle ? <p className="text-xs text-slate-400 mt-1">{String(item.angle)}</p> : null}
                </div>
              );
            })}
          </div>
        </Section>
      )}
      {combos.length > 0 && (
        <Section title={outputCopy.recommendedCombinations}>
          <div className="space-y-2">
            {combos.map((combo, index) => {
              if (!isObject(combo)) return null;
              return (
                <div key={`combo-${index}`} className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
                  <p className="text-sm font-semibold text-slate-100">{String(combo.title)} + {String(combo.thumbnailText)}</p>
                  {combo.rationale ? <p className="text-xs text-slate-400 mt-1">{String(combo.rationale)}</p> : null}
                </div>
              );
            })}
          </div>
        </Section>
      )}
      {actionPlanContent && <Section title={outputCopy.actionPlan}>{actionPlanContent}</Section>}
    </div>
  );
}

function renderOutput(profileKey: string | null, output: unknown, outputCopy: ReturnType<typeof getAiOutputCopy>) {
  if (!profileKey || !isObject(output)) {
    return <div className="text-sm text-slate-400">{outputCopy.noOutput}</div>;
  }
  if (profileKey === 'evergreen_ideas') return renderEvergreenOutput(output, outputCopy);
  if (profileKey === 'script_architect') return renderScriptOutput(output, outputCopy);
  if (profileKey === 'retention_editor') return renderRetentionOutput(output, outputCopy);
  if (profileKey === 'titles_thumbs') return renderTitlesOutput(output, outputCopy);
  return <div className="text-sm text-slate-400">{outputCopy.unsupportedOutput}</div>;
}

function renderInputSummary(input: unknown, outputCopy: ReturnType<typeof getAiOutputCopy>) {
  if (!isObject(input)) return <div className="text-sm text-slate-400">{outputCopy.noInput}</div>;
  const entries = Object.entries(input).filter(([, value]) => value !== null && value !== undefined && value !== '');
  if (entries.length === 0) return <div className="text-sm text-slate-400">{outputCopy.noInput}</div>;
  return (
    <ul className="text-xs text-slate-200 space-y-1">
      {entries.map(([key, value]) => (
        <li key={key}><span className="text-slate-400">{key}:</span> {String(value)}</li>
      ))}
    </ul>
  );
}

function AiStudioContent() {
  const { locale } = useLocale();
  const aiOutputCopy = getAiOutputCopy(locale);
  const uiCopy = locale === 'en'
    ? {
      intro: 'Welcome to CronoStudio. Crono helps you plan and produce your content with an auto-first flow and fine-grained control.',
      maxTokens: 'Max tokens',
      runs: 'runs',
      refresh: 'Refresh',
      availableProfiles: 'Available profiles',
      selectProfileHelp: 'Select a profile and complete the input.',
      profileBrief: 'Profile brief',
      naturalLanguageHelp: 'Complete the information in natural language.',
      selectProfileToViewFields: 'Select a profile to view fields.',
      selectIdea: 'Select an idea',
      selectScript: 'Select a script',
      nichePresets: 'Niche presets',
      nichePresetHelp: 'Select a preset to complete the base topic with tone and structure.',
      scriptTemplates: 'Script templates',
      scriptTemplateHelp: 'Select a style to guide the script.',
      generating: 'Generating...',
      generatePrompt: 'Generate prompt',
      executing: 'Executing...',
      generateAndApply: 'Generate and apply',
      copyPrompt: 'Copy prompt',
      manualModeTitle: 'Generated prompt (manual mode)',
      manualModeHelp: 'Copy and paste into your AI. Then paste the full response here and we validate it internally.',
      pasteGptResponse: 'Paste the GPT response here (no formatting needed)',
      validateAndSave: 'Validate and save',
      applying: 'Applying...',
      apply: 'Apply',
      generatePromptToContinue: 'Generate a prompt to continue.',
      autoFirstResult: 'Auto-first result',
      autoFirstHelp: 'Output generated and applied automatically.',
      applied: 'Applied',
      executeToSeeResult: 'Run "Generate and apply" to see the result here.',
      historyByChannel: 'History by channel',
      latestRuns: 'Latest runs for the selected channel.',
      noRunsYet: 'No runs yet for this channel.',
      run: 'Run',
      close: 'Close',
      input: 'Input',
      output: 'Output',
      viewTechnicalData: 'View technical data (JSON)',
    }
    : {
      intro: 'Bienvenido a CronoStudio. Crono te ayuda a planificar y producir tus contenidos con flujo auto-first y control fino.',
      maxTokens: 'Max tokens',
      runs: 'runs',
      refresh: 'Actualizar',
      availableProfiles: 'Perfiles disponibles',
      selectProfileHelp: 'Selecciona un perfil y completa el input.',
      profileBrief: 'Brief del perfil',
      naturalLanguageHelp: 'Completa la informacion en lenguaje natural.',
      selectProfileToViewFields: 'Selecciona un perfil para ver los campos.',
      selectIdea: 'Selecciona una idea',
      selectScript: 'Selecciona un guion',
      nichePresets: 'Presets por nicho',
      nichePresetHelp: 'Selecciona un preset para completar el tema base con tono y estructura.',
      scriptTemplates: 'Plantillas de guion',
      scriptTemplateHelp: 'Selecciona un estilo para orientar el guion.',
      generating: 'Generando...',
      generatePrompt: 'Generar prompt',
      executing: 'Ejecutando...',
      generateAndApply: 'Generar y aplicar',
      copyPrompt: 'Copiar prompt',
      manualModeTitle: 'Prompt generado (modo manual)',
      manualModeHelp: 'Copia y pegalo en tu AI. Luego pega la respuesta completa aqui y la validamos internamente.',
      pasteGptResponse: 'Pega aqui la respuesta del GPT (no necesitas formatear nada)',
      validateAndSave: 'Validar y guardar',
      applying: 'Aplicando...',
      apply: 'Aplicar',
      generatePromptToContinue: 'Genera un prompt para continuar.',
      autoFirstResult: 'Resultado auto-first',
      autoFirstHelp: 'Salida generada y aplicada automaticamente.',
      applied: 'Aplicado',
      executeToSeeResult: 'Ejecuta "Generar y aplicar" para ver el resultado aqui.',
      historyByChannel: 'Historial por canal',
      latestRuns: 'Ultimas ejecuciones del canal seleccionado.',
      noRunsYet: 'Aun no hay runs para este canal.',
      run: 'Run',
      close: 'Cerrar',
      input: 'Input',
      output: 'Output',
      viewTechnicalData: 'Ver datos tecnicos (JSON)',
    };
  const searchParams = useSearchParams();
  const publicModel = process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini';
  const publicMaxTokens = process.env.NEXT_PUBLIC_OPENAI_MAX_OUTPUT_TOKENS || '800';
  const { isAuthenticated } = useAuth();
  const authFetch = useAuthFetch();
  const { addToast } = useToast();
  const { state, actions, refs } = useAiStudio({
    isAuthenticated,
    authFetch,
    addToast,
    searchParams,
  });

  const {
    loading,
    submitting,
    executing,
    applying,
    profiles,
    channels,
    runs,
    ideaOptions,
    scriptOptions,
    selectedChannel,
    activeProfile,
    selectedRun,
    formInputs,
    prompt,
    currentRunId,
    currentStatus,
    outputText,
    autoOutput,
    autoApplied,
    autoOutputProfileKey,
    activeFields,
    showIdeaPresets,
    showScriptPresets,
  } = state;

  const {
    setSelectedChannel,
    setActiveProfile,
    setSelectedRun,
    setFormInputs,
    setOutputText,
    refreshRuns,
    generatePrompt,
    executeRun,
    submitOutput,
    applyRun,
    copyPrompt,
    resetRunState,
  } = actions;

  const { modalRef } = refs;


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
          <h1 className="sr-only">Crono</h1>
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
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">Crono</h2>
                </div>
                <p className="text-sm sm:text-base text-slate-300">{uiCopy.intro}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 justify-start sm:justify-end">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="uppercase tracking-[0.2em] text-[10px] text-slate-500">Modelo</span>
                <span className="text-slate-300">{publicModel}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{uiCopy.maxTokens} {publicMaxTokens}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <History className="w-4 h-4" />
                <span>{runs.length} {uiCopy.runs}</span>
              </div>
                <button
                  type="button"
                  onClick={refreshRuns}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-lg border border-gray-800 text-slate-300 hover:text-yellow-300 hover:border-yellow-500/40"
                >
                <RefreshCw className="w-4 h-4" />
                {uiCopy.refresh}
              </button>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
            <div className="space-y-6 min-w-0">
              <CronoChatPanel />

              <section className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.25)]">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{uiCopy.availableProfiles}</h3>
                      <p className="text-sm text-slate-400">{uiCopy.selectProfileHelp}</p>
                    </div>
                    <select
                      className="w-full sm:w-auto bg-gray-900/60 border border-gray-800 text-sm text-slate-200 rounded-lg px-3 py-2"
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
                            resetRunState();
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
                  <h3 className="text-lg font-semibold text-white">{uiCopy.profileBrief}</h3>
                  <p className="text-sm text-slate-400">{uiCopy.naturalLanguageHelp}</p>
                  </div>
                </div>

                {activeFields.length === 0 ? (
                  <div className="text-sm text-slate-400">{uiCopy.selectProfileToViewFields}</div>
                ) : (
                  <div className="grid gap-3">
                    {activeFields.map((field) => (
                      <label key={field.key} className="text-sm text-slate-300">
                        <span className="block mb-1">{field.label}{field.required ? ' *' : ''}</span>
                        {field.key === 'ideaId' ? (
                          <select
                            className="w-full rounded-lg border border-gray-800 bg-gray-900/70 px-3 py-2 text-sm text-slate-100"
                            value={formInputs.ideaId}
                            onChange={(event) => setFormInputs((prev) => ({ ...prev, ideaId: event.target.value }))}
                          >
                            <option value="">{uiCopy.selectIdea}</option>
                            {ideaOptions.map((idea) => (
                              <option key={idea.id} value={idea.id}>{idea.title}</option>
                            ))}
                          </select>
                        ) : field.key === 'scriptId' ? (
                          <select
                            className="w-full rounded-lg border border-gray-800 bg-gray-900/70 px-3 py-2 text-sm text-slate-100"
                            value={formInputs.scriptId}
                            onChange={(event) => setFormInputs((prev) => ({ ...prev, scriptId: event.target.value }))}
                          >
                            <option value="">{uiCopy.selectScript}</option>
                            {scriptOptions.map((script) => (
                              <option key={script.id} value={script.id}>{script.title}</option>
                            ))}
                          </select>
                        ) : field.multiline ? (
                          <textarea
                            className="min-h-[96px] w-full rounded-lg border border-gray-800 bg-gray-900/70 px-3 py-2 text-sm text-slate-100"
                            placeholder={field.placeholder}
                            value={formInputs[field.key]}
                            onChange={(event) => setFormInputs((prev) => ({ ...prev, [field.key]: event.target.value }))}
                          />
                        ) : (
                          <input
                            className="w-full rounded-lg border border-gray-800 bg-gray-900/70 px-3 py-2 text-sm text-slate-100"
                            placeholder={field.placeholder}
                            value={formInputs[field.key]}
                            onChange={(event) => setFormInputs((prev) => ({ ...prev, [field.key]: event.target.value }))}
                          />
                        )}
                      </label>
                    ))}
                    {showIdeaPresets && (
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{uiCopy.nichePresets}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {IDEA_PRESETS.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              className="rounded-full border border-gray-800 px-3 py-1 text-xs text-slate-200 hover:border-yellow-500/40"
                              onClick={() => setFormInputs((prev) => ({ ...prev, topicSeed: preset.seed }))}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-slate-500">{uiCopy.nichePresetHelp}</p>
                      </div>
                    )}
                    {showScriptPresets && (
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{uiCopy.scriptTemplates}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {SCRIPT_STYLE_PRESETS.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              className="rounded-full border border-gray-800 px-3 py-1 text-xs text-slate-200 hover:border-yellow-500/40"
                              onClick={() => setFormInputs((prev) => ({ ...prev, styleGuide: preset.guide }))}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-slate-500">{uiCopy.scriptTemplateHelp}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={generatePrompt}
                    disabled={submitting || !activeProfile}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black rounded-lg bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60"
                  >
                    <Sparkles className="w-4 h-4" />
                    {submitting ? uiCopy.generating : uiCopy.generatePrompt}
                  </button>
                  <button
                    type="button"
                    onClick={executeRun}
                    disabled={executing || !activeProfile}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black rounded-lg bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60"
                  >
                    <ArrowRight className="w-4 h-4" />
                    {executing ? uiCopy.executing : uiCopy.generateAndApply}
                  </button>
                  {prompt && (
                    <button
                      type="button"
                      onClick={copyPrompt}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-800 text-slate-200 rounded-lg hover:border-yellow-500/40"
                    >
                      <Clipboard className="w-4 h-4" />
                      {uiCopy.copyPrompt}
                    </button>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{uiCopy.manualModeTitle}</h3>
                  <p className="text-sm text-slate-400">{uiCopy.manualModeHelp}</p>
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
                      placeholder={uiCopy.pasteGptResponse}
                      value={outputText}
                      onChange={(event) => setOutputText(event.target.value)}
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={submitOutput}
                        disabled={submitting || !currentRunId}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black rounded-lg bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60"
                      >
                        <Check className="w-4 h-4" />
                        {uiCopy.validateAndSave}
                      </button>
                      <button
                        type="button"
                        onClick={applyRun}
                        disabled={applying || currentStatus !== 'completed'}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-800 text-slate-200 rounded-lg hover:border-yellow-500/40 disabled:opacity-60"
                      >
                        <ArrowRight className="w-4 h-4" />
                        {applying ? uiCopy.applying : uiCopy.apply}
                      </button>
                      {currentStatus && (
                        <span className={`text-xs px-2 py-1 rounded-full ${statusBadge(currentStatus)}`}>
                          {currentStatus}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">{uiCopy.generatePromptToContinue}</div>
                )}
              </section>

              <section className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{uiCopy.autoFirstResult}</h3>
                  <p className="text-sm text-slate-400">{uiCopy.autoFirstHelp}</p>
                </div>
                {autoOutput ? (
                  <div className="grid gap-3">
                    <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
                      {renderOutput(autoOutputProfileKey ?? activeProfile?.key ?? null, autoOutput, aiOutputCopy)}
                    </div>
                    {autoApplied && (
                      <div className="text-xs text-slate-300">
                        {uiCopy.applied}: {Object.keys(autoApplied).join(', ') || 'OK'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">{uiCopy.executeToSeeResult}</div>
                )}
              </section>
            </div>

            <section className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 space-y-4 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{uiCopy.historyByChannel}</h3>
                  <p className="text-sm text-slate-400">{uiCopy.latestRuns}</p>
                </div>
              </div>
              {runs.length === 0 ? (
                <div className="text-sm text-slate-400">{uiCopy.noRunsYet}</div>
              ) : (
                <div className="space-y-2">
                  {runs.map((run) => (
                    <button
                      key={run.id}
                      type="button"
                      onClick={() => setSelectedRun(run)}
                      className="w-full text-left rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3 hover:border-yellow-500/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-100 truncate">{run.profile_key}</p>
                          <p className="text-xs text-slate-500 truncate">{formatDateTime(run.created_at)}</p>
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
                    <p className="text-lg font-semibold text-white">{uiCopy.run} {selectedRun.id.slice(0, 8)}</p>
                  </div>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-yellow-400"
                    onClick={() => setSelectedRun(null)}
                  >
                    {uiCopy.close}
                  </button>
                </div>
                <div className="grid gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-1">{uiCopy.input}</p>
                    <div className="text-xs text-slate-200 bg-gray-900/70 border border-gray-800 rounded-lg p-3 overflow-auto max-h-48">
                      {renderInputSummary(selectedRun.input_json, aiOutputCopy)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-1">{uiCopy.output}</p>
                    <div className="text-xs text-slate-200 bg-gray-900/70 border border-gray-800 rounded-lg p-3 overflow-auto max-h-64">
                      {renderOutput(selectedRun.profile_key, selectedRun.output_json ?? {}, aiOutputCopy)}
                    </div>
                  </div>
                  <details className="text-xs text-slate-400">
                    <summary className="cursor-pointer">{uiCopy.viewTechnicalData}</summary>
                    <pre className="mt-2 text-xs text-slate-200 bg-gray-900/70 border border-gray-800 rounded-lg p-3 overflow-auto max-h-48">
                      {JSON.stringify(selectedRun.output_json ?? {}, null, 2)}
                    </pre>
                  </details>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}

export default function AiStudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex flex-col" />}>
      <AiStudioContent />
    </Suspense>
  );
}
