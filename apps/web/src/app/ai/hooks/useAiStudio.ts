import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useDialogFocus from '@/app/hooks/useDialogFocus';
import { aiStudioService } from '@/app/ai/services/aiStudioService';
import { AI_PROFILE_FIELDS } from '@/app/content/aiProfileFields';
import type { Channel, FormInputs, IdeaOption, Profile, PromptPayload, Run, ScriptOption } from '@/app/ai/types';

type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

type UseAiStudioOptions = {
  isAuthenticated: boolean;
  authFetch: AuthFetch;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  searchParams: URLSearchParams | null;
};

export function useAiStudio({ isAuthenticated, authFetch, addToast, searchParams }: UseAiStudioOptions) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [ideaOptions, setIdeaOptions] = useState<IdeaOption[]>([]);
  const [scriptOptions, setScriptOptions] = useState<ScriptOption[]>([]);
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
  const [autoOutputProfileKey, setAutoOutputProfileKey] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const queryInitializedRef = useRef(false);

  useDialogFocus(modalRef, Boolean(selectedRun));

  const [formInputs, setFormInputs] = useState<FormInputs>({
    topicSeed: '',
    channelStage: '',
    targetAudience: '',
    primaryGoal: '',
    resources: '',
    constraints: '',
    ideaId: '',
    scriptId: '',
    targetLengthSec: '',
    depthLevel: '',
    tone: '',
    scriptSummary: '',
    primaryEmotion: '',
    styleGuide: '',
  });

  const showIdeaPresets = activeProfile?.key === 'evergreen_ideas';
  const showScriptPresets = activeProfile?.key === 'script_architect';

  const extractJsonFromText = (text: string): unknown | null => {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fencedMatch?.[1]?.trim() ?? trimmed;

    try {
      return JSON.parse(candidate);
    } catch {
      const firstBrace = candidate.indexOf('{');
      const lastBrace = candidate.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        const slice = candidate.slice(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(slice);
        } catch {
          return null;
        }
      }
      const firstBracket = candidate.indexOf('[');
      const lastBracket = candidate.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        const slice = candidate.slice(firstBracket, lastBracket + 1);
        try {
          return JSON.parse(slice);
        } catch {
          return null;
        }
      }
      return null;
    }
  };

  const fetchProfiles = useCallback(async () => {
    try {
      const result = await aiStudioService.fetchProfiles(authFetch);
      setProfiles(result);
    } catch (error) {
      console.error('Error fetching profiles', error);
    }
  }, [authFetch]);

  const fetchChannels = useCallback(async () => {
    try {
      const result = await aiStudioService.fetchChannels(authFetch);
      setChannels(result);
      if (!selectedChannel && result.length) {
        setSelectedChannel(result[0].id);
      }
    } catch (error) {
      console.error('Error fetching channels', error);
    }
  }, [authFetch, selectedChannel]);

  const fetchRuns = useCallback(async (channelId: string) => {
    try {
      const result = await aiStudioService.fetchRuns(authFetch, channelId);
      setRuns(result);
    } catch (error) {
      console.error('Error fetching runs', error);
    }
  }, [authFetch]);

  const fetchIdeaOptions = useCallback(async (channelId: string) => {
    try {
      const options = await aiStudioService.fetchIdeaOptions(authFetch, channelId);
      setIdeaOptions(options);
    } catch (error) {
      console.error('Error fetching ideas', error);
    }
  }, [authFetch]);

  const fetchScriptOptions = useCallback(async (channelId: string) => {
    try {
      const options = await aiStudioService.fetchScriptOptions(authFetch, channelId);
      setScriptOptions(options);
    } catch (error) {
      console.error('Error fetching scripts', error);
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
    fetchIdeaOptions(selectedChannel);
    fetchScriptOptions(selectedChannel);
  }, [selectedChannel, fetchRuns, fetchIdeaOptions, fetchScriptOptions]);

  useEffect(() => {
    if (queryInitializedRef.current) return;
    if (!searchParams) return;

    const profileKey = searchParams.get('profile');
    const channelId = searchParams.get('channelId');
    const ideaId = searchParams.get('ideaId');
    const scriptId = searchParams.get('scriptId');

    if (!profileKey && !channelId && !ideaId && !scriptId) return;

    if (profileKey && profiles.length === 0) return;

    if (channelId) {
      setSelectedChannel(channelId);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('cronostudio.channelId', channelId);
      }
    }

    if (profileKey) {
      const match = profiles.find((profile) => profile.key === profileKey);
      if (match) setActiveProfile(match);
    }

    if (ideaId || scriptId) {
      setFormInputs((prev) => ({
        ...prev,
        ideaId: ideaId ?? prev.ideaId,
        scriptId: scriptId ?? prev.scriptId,
      }));
    }

    queryInitializedRef.current = true;
  }, [searchParams, profiles]);

  const activeFields = useMemo(() => {
    if (!activeProfile) return [];
    return AI_PROFILE_FIELDS[activeProfile.key] ?? [];
  }, [activeProfile]);

  const buildInputPayload = useCallback(() => {
    const inputPayload: Record<string, string> = {};
    if (formInputs.topicSeed.trim()) inputPayload.topicSeed = formInputs.topicSeed.trim();
    if (formInputs.channelStage.trim()) inputPayload.channelStage = formInputs.channelStage.trim();
    if (formInputs.targetAudience.trim()) inputPayload.targetAudience = formInputs.targetAudience.trim();
    if (formInputs.primaryGoal.trim()) inputPayload.primaryGoal = formInputs.primaryGoal.trim();
    if (formInputs.resources.trim()) inputPayload.resources = formInputs.resources.trim();
    if (formInputs.constraints.trim()) inputPayload.constraints = formInputs.constraints.trim();
    if (formInputs.ideaId.trim()) inputPayload.ideaId = formInputs.ideaId.trim();
    if (formInputs.scriptId.trim()) inputPayload.scriptId = formInputs.scriptId.trim();
    if (formInputs.targetLengthSec.trim()) inputPayload.targetLengthSec = formInputs.targetLengthSec.trim();
    if (formInputs.depthLevel.trim()) inputPayload.depthLevel = formInputs.depthLevel.trim();
    if (formInputs.tone.trim()) inputPayload.tone = formInputs.tone.trim();
    if (formInputs.scriptSummary.trim()) inputPayload.scriptSummary = formInputs.scriptSummary.trim();
    if (formInputs.primaryEmotion.trim()) inputPayload.primaryEmotion = formInputs.primaryEmotion.trim();
    if (formInputs.styleGuide.trim()) inputPayload.styleGuide = formInputs.styleGuide.trim();
    return inputPayload;
  }, [formInputs]);

  const generatePrompt = useCallback(async () => {
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
      const payload = {
        profileKey: activeProfile.key,
        channelId: selectedChannel,
        input: buildInputPayload(),
      };
      const data = await aiStudioService.createRun(authFetch, payload);
      setPrompt(data.prompt);
      setCurrentRunId(data.runId);
      setCurrentStatus('awaiting_input');
      addToast('Prompt generado', 'success');
      fetchRuns(selectedChannel);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'No se pudo generar', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [activeProfile, selectedChannel, activeFields, formInputs, buildInputPayload, authFetch, addToast, fetchRuns]);

  const executeRun = useCallback(async () => {
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
    setAutoOutput(null);
    setAutoApplied(null);
    try {
      const payload = {
        profileKey: activeProfile.key,
        channelId: selectedChannel,
        input: buildInputPayload(),
      };
      const data = await aiStudioService.executeRun(authFetch, payload);
      setPrompt(null);
      setCurrentRunId(data.runId);
      setCurrentStatus('completed');
      setAutoOutput(data.output ?? null);
      setAutoApplied(data.applied ?? null);
      setAutoOutputProfileKey(activeProfile.key);
      setOutputText(JSON.stringify(data.output ?? {}, null, 2));
      addToast('Run ejecutado', 'success');
      fetchRuns(selectedChannel);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Error al ejecutar', 'error');
    } finally {
      setExecuting(false);
    }
  }, [activeProfile, selectedChannel, activeFields, formInputs, buildInputPayload, authFetch, addToast, fetchRuns]);

  const copyPrompt = useCallback(async () => {
    if (!prompt) return;
    const combined = `SYSTEM:\n${prompt.system}\n\nUSER:\n${prompt.user}`;
    try {
      await navigator.clipboard.writeText(combined);
      addToast('Prompt copiado', 'success');
    } catch {
      addToast('No se pudo copiar el prompt', 'error');
    }
  }, [prompt, addToast]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const handler = (event: KeyboardEvent) => {
      if (event.target && (event.target as HTMLElement).tagName === 'INPUT') return;
      if (event.target && (event.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (!activeProfile) return;

      if (event.key.toLowerCase() === 'g') {
        event.preventDefault();
        generatePrompt();
      }
      if (event.key.toLowerCase() === 'a') {
        event.preventDefault();
        executeRun();
      }
      if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        if (prompt) copyPrompt();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAuthenticated, activeProfile, prompt, generatePrompt, executeRun, copyPrompt]);

  const submitOutput = useCallback(async () => {
    if (!currentRunId) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(outputText);
    } catch {
      const extracted = extractJsonFromText(outputText);
      if (!extracted) {
        addToast('No pude encontrar JSON valido en la respuesta.', 'error');
        return;
      }
      parsed = extracted;
    }

    setSubmitting(true);
    try {
      await aiStudioService.submitRunOutput(authFetch, currentRunId, parsed);
      setCurrentStatus('completed');
      addToast('Resultado guardado', 'success');
      fetchRuns(selectedChannel);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Error al guardar output', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [currentRunId, outputText, authFetch, addToast, fetchRuns, selectedChannel]);

  const applyRun = useCallback(async () => {
    if (!currentRunId) return;
    setApplying(true);
    try {
      const data = await aiStudioService.applyRun(authFetch, currentRunId);
      addToast(`Aplicado: ${Object.keys(data.applied ?? {}).join(', ') || 'OK'}`, 'success');
      fetchRuns(selectedChannel);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Error al aplicar', 'error');
    } finally {
      setApplying(false);
    }
  }, [currentRunId, authFetch, addToast, fetchRuns, selectedChannel]);

  const resetRunState = useCallback(() => {
    setPrompt(null);
    setCurrentRunId(null);
    setCurrentStatus(null);
    setAutoOutput(null);
    setAutoApplied(null);
    setAutoOutputProfileKey(null);
    setOutputText('');
  }, []);

  return {
    state: {
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
    },
    refs: {
      modalRef,
    },
    actions: {
      setSelectedChannel,
      setActiveProfile,
      setSelectedRun,
      setFormInputs,
      setOutputText,
      refreshRuns: () => selectedChannel && fetchRuns(selectedChannel),
      generatePrompt,
      executeRun,
      submitOutput,
      applyRun,
      copyPrompt,
      resetRunState,
    },
  };
}
