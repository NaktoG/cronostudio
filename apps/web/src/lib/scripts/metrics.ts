export type ScriptMetrics = {
  introReady: boolean;
  bodyReady: boolean;
  ctaReady: boolean;
  outroReady: boolean;
  wordCount: number;
  estimatedSeconds: number;
  readyCount: number;
  total: number;
  score: number;
};

export function calculateScriptMetrics(input: {
  intro?: string | null;
  body?: string | null;
  cta?: string | null;
  outro?: string | null;
}): ScriptMetrics {
  const introReady = Boolean(input.intro?.trim());
  const bodyReady = Boolean(input.body?.trim());
  const ctaReady = Boolean(input.cta?.trim());
  const outroReady = Boolean(input.outro?.trim());
  const raw = [input.intro, input.body, input.cta, input.outro].filter(Boolean).join(' ');
  const wordCount = raw ? raw.trim().split(/\s+/).filter(Boolean).length : 0;
  const estimatedSeconds = wordCount > 0 ? Math.ceil((wordCount / 150) * 60) : 0;
  const total = 4;
  const readyCount = [introReady, bodyReady, ctaReady, outroReady].filter(Boolean).length;
  return {
    introReady,
    bodyReady,
    ctaReady,
    outroReady,
    wordCount,
    estimatedSeconds,
    readyCount,
    total,
    score: Math.round((readyCount / total) * 100),
  };
}
