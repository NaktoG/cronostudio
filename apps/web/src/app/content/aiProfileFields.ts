export type ProfileFieldKey = 'topicSeed' | 'ideaId' | 'scriptId' | 'styleGuide';

export type ProfileField = {
  label: string;
  placeholder: string;
  key: ProfileFieldKey;
  required?: boolean;
};

export const AI_PROFILE_FIELDS: Record<string, ProfileField[]> = {
  evergreen_ideas: [
    { key: 'topicSeed', label: 'Tema base (opcional)', placeholder: 'Ej: productividad, marketing, IA' },
    { key: 'styleGuide', label: 'Estilo (opcional)', placeholder: 'Ej: didactico, directo, con ejemplos reales' },
  ],
  script_architect: [
    { key: 'ideaId', label: 'Idea ID', placeholder: 'UUID de la idea', required: true },
    { key: 'styleGuide', label: 'Estilo del guion (opcional)', placeholder: 'Ej: storytelling, tutorial, directo' },
  ],
  retention_editor: [
    { key: 'scriptId', label: 'Script ID', placeholder: 'UUID del guion', required: true },
  ],
  titles_thumbs: [
    { key: 'ideaId', label: 'Idea ID', placeholder: 'UUID de la idea', required: true },
    { key: 'scriptId', label: 'Script ID (opcional)', placeholder: 'UUID del guion' },
  ],
};
