import type { Locale } from '@/app/i18n/messages';

const AI_OUTPUT_COPY_BY_LOCALE = {
  es: {
    script: 'Guion',
    optimizedScript: 'Guion optimizado',
    proposedTitles: 'Titulos propuestos',
  },
  en: {
    script: 'Script',
    optimizedScript: 'Optimized script',
    proposedTitles: 'Proposed titles',
  },
} as const;

export function getAiOutputCopy(locale: Locale) {
  return AI_OUTPUT_COPY_BY_LOCALE[locale] ?? AI_OUTPUT_COPY_BY_LOCALE.es;
}
