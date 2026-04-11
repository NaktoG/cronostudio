export const CRONO_COPY = {
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
} as const;

export type CronoRole = 'assistant' | 'user';
