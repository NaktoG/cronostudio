export type ProfileFieldKey =
  | 'topicSeed'
  | 'channelStage'
  | 'targetAudience'
  | 'primaryGoal'
  | 'resources'
  | 'constraints'
  | 'ideaId'
  | 'scriptId'
  | 'targetLengthSec'
  | 'depthLevel'
  | 'tone'
  | 'scriptSummary'
  | 'primaryEmotion'
  | 'styleGuide';

export type ProfileField = {
  label: string;
  placeholder: string;
  key: ProfileFieldKey;
  required?: boolean;
  multiline?: boolean;
};

export const AI_PROFILE_FIELDS: Record<string, ProfileField[]> = {
  evergreen_ideas: [
    { key: 'topicSeed', label: 'Tema base o nicho (opcional)', placeholder: 'Ej: productividad, finanzas, salud mental' },
    { key: 'channelStage', label: 'Etapa del canal', placeholder: 'Ej: nuevo, en crecimiento, estable', required: true },
    { key: 'targetAudience', label: 'Publico objetivo', placeholder: 'Ej: jovenes profesionales en LATAM', required: true },
    { key: 'primaryGoal', label: 'Objetivo principal', placeholder: 'Ej: monetizar con afiliados en 90 dias', required: true },
    { key: 'resources', label: 'Recursos actuales', placeholder: 'Ej: voz IA, editor freelance, 4 videos/mes', multiline: true },
    { key: 'constraints', label: 'Limitaciones (opcional)', placeholder: 'Ej: sin camara, sin locacion, equipo limitado', multiline: true },
    { key: 'styleGuide', label: 'Estilo (opcional)', placeholder: 'Ej: didactico, directo, con ejemplos reales' },
  ],
  script_architect: [
    { key: 'ideaId', label: 'Idea seleccionada', placeholder: 'Selecciona una idea', required: true },
    { key: 'targetLengthSec', label: 'Duracion objetivo (segundos)', placeholder: 'Ej: 480' },
    { key: 'tone', label: 'Tono', placeholder: 'Ej: directo, emocional, educativo' },
    { key: 'depthLevel', label: 'Nivel de profundidad', placeholder: 'Ej: basico, intermedio, avanzado' },
    { key: 'styleGuide', label: 'Guia de estilo (opcional)', placeholder: 'Ej: storytelling, tutorial, directo' },
  ],
  retention_editor: [
    { key: 'scriptId', label: 'Guion seleccionado', placeholder: 'Selecciona un guion', required: true },
    { key: 'targetLengthSec', label: 'Duracion objetivo (segundos)', placeholder: 'Ej: 420' },
    { key: 'tone', label: 'Tono (opcional)', placeholder: 'Ej: sobrio, directo, empatico' },
  ],
  titles_thumbs: [
    { key: 'ideaId', label: 'Idea seleccionada', placeholder: 'Selecciona una idea', required: true },
    { key: 'scriptId', label: 'Guion (opcional)', placeholder: 'Selecciona un guion' },
    { key: 'primaryEmotion', label: 'Emocion principal', placeholder: 'Ej: curiosidad, tension, esperanza', required: true },
    { key: 'scriptSummary', label: 'Resumen del guion (opcional)', placeholder: 'Pega un resumen breve si no hay guion', multiline: true },
  ],
};
