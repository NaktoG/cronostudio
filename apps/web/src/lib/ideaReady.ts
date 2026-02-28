export type IdeaReadyCheck = {
  isReady: boolean;
  errors: string[];
};

const PROMISE_REGEX = /en este video vas a entender\s+[^.\n]+/i;
const BULLET_REGEX = /^\s*(?:[-*•]|\d+\.)\s+\S+/;
const HOOK_LABEL_REGEX = /hook\s*[:\-]/i;

function countSentences(text: string): number {
  const parts = text
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return parts.length;
}

function extractHook(text: string): string {
  const match = text.match(/hook\s*[:\-]\s*([\s\S]*)/i);
  if (!match) return '';
  return match[1].trim();
}

export function evaluateIdeaReady(title: string, description: string | null | undefined): IdeaReadyCheck {
  const errors: string[] = [];
  const safeTitle = title?.trim() ?? '';
  const safeDescription = description?.trim() ?? '';

  if (!safeTitle) {
    errors.push('Falta titulo');
  }

  if (!PROMISE_REGEX.test(safeDescription)) {
    errors.push('Falta promesa');
  }

  const bulletLines = safeDescription
    .split('\n')
    .filter((line) => BULLET_REGEX.test(line));
  if (bulletLines.length < 3) {
    errors.push('Faltan bullets (min 3)');
  }

  const hookText = extractHook(safeDescription);
  if (!hookText) {
    errors.push('Falta hook (min 2 frases o 200 chars)');
  } else {
    const hasTwoSentences = countSentences(hookText) >= 2;
    const hasMinChars = hookText.length >= 200;
    if (!hasTwoSentences && !hasMinChars) {
      errors.push('Falta hook (min 2 frases o 200 chars)');
    }
  }

  return {
    isReady: errors.length === 0,
    errors,
  };
}

export function getIdeaReadyErrors(title: string, description: string | null | undefined): string[] {
  return evaluateIdeaReady(title, description).errors;
}

export function isIdeaReady(title: string, description: string | null | undefined): boolean {
  return evaluateIdeaReady(title, description).isReady;
}
