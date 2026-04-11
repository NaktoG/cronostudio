import type { Locale } from '@/app/i18n/messages';

const CRONO_COPY_BY_LOCALE = {
  es: {
    panelTitle: 'Crono',
    panelSubtitle: 'Tu asistente operativo para planificar, producir y mantener consistencia en tu canal.',
    userLabel: 'Tu',
    introMessage: 'Bienvenido a CronoStudio. Soy Crono, listo para ayudarte a organizar y producir tus contenidos.',
    inputPlaceholder: 'Escribe tu solicitud para Crono...',
    sendButton: 'Enviar',
    sendingButton: 'Enviando...',
    suggestionLabel: 'Sugerencias',
    suggestions: [
      'Dame el plan de hoy para mi canal',
      'Resume bloqueos y prioridades de la semana',
      'Propón 3 ideas evergreen para publicar esta semana',
    ],
    unavailable: 'Crono no está disponible en este entorno. Revisa la configuración del gateway.',
    genericError: 'No pude completar la solicitud. Intenta nuevamente en unos segundos.',
    emptyMessageError: 'Escribe un mensaje antes de enviarlo.',
  },
  en: {
    panelTitle: 'Crono',
    panelSubtitle: 'Your operating assistant to plan, produce, and keep channel consistency.',
    userLabel: 'You',
    introMessage: 'Welcome to CronoStudio. I am Crono, ready to help you organize and produce your content.',
    inputPlaceholder: 'Write your request for Crono...',
    sendButton: 'Send',
    sendingButton: 'Sending...',
    suggestionLabel: 'Suggestions',
    suggestions: [
      'Give me today\'s plan for my channel',
      'Summarize blockers and priorities for this week',
      'Propose 3 evergreen ideas to publish this week',
    ],
    unavailable: 'Crono is unavailable in this environment. Check gateway configuration.',
    genericError: 'I could not complete the request. Try again in a few seconds.',
    emptyMessageError: 'Write a message before sending.',
  },
} as const;

export const CRONO_COPY = CRONO_COPY_BY_LOCALE.es;

export function getCronoCopy(locale: Locale) {
  return CRONO_COPY_BY_LOCALE[locale] ?? CRONO_COPY_BY_LOCALE.es;
}

export type CronoRole = 'assistant' | 'user';
