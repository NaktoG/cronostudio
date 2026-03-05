export type OnboardingCounts = {
  channels: number;
  ideas: number;
  ideasApproved: number;
  scripts: number;
  scriptsReady: number;
  seo: number;
  thumbnailsApproved: number;
  published: number;
};

export type OnboardingStepDefinition = {
  id: string;
  title: string;
  description: string;
  href: string;
  action: string;
  isDone: (counts: OnboardingCounts) => boolean;
};

export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  {
    id: 'channel',
    title: 'Conecta tu canal',
    description: 'Crea o conecta tu canal para que todo quede asociado.',
    href: '/channels',
    action: 'Ir a canales',
    isDone: (counts) => counts.channels > 0,
  },
  {
    id: 'ideas',
    title: 'Genera ideas',
    description: 'En AI Studio usa evergreen_ideas y genera 10 ideas aplicadas.',
    href: '/ai',
    action: 'Abrir AI Studio',
    isDone: (counts) => counts.ideas > 0,
  },
  {
    id: 'ideas-approve',
    title: 'Aprueba ideas',
    description: 'Pulí las ideas y marcá las listas para pasar a guion.',
    href: '/ideas',
    action: 'Ver ideas',
    isDone: (counts) => counts.ideasApproved > 0,
  },
  {
    id: 'scripts',
    title: 'Crea el guion',
    description: 'Usa script_architect para generar el guion completo.',
    href: '/ai',
    action: 'Generar guion',
    isDone: (counts) => counts.scriptsReady > 0 || counts.scripts > 0,
  },
  {
    id: 'seo',
    title: 'Optimiza SEO',
    description: 'Genera titulos, miniaturas y tags con titles_thumbs.',
    href: '/ai',
    action: 'Optimizar SEO',
    isDone: (counts) => counts.seo > 0,
  },
  {
    id: 'thumbnails',
    title: 'Aprueba miniatura',
    description: 'Definí el texto/imagen final antes de publicar.',
    href: '/thumbnails',
    action: 'Ver miniaturas',
    isDone: (counts) => counts.thumbnailsApproved > 0,
  },
  {
    id: 'publish',
    title: 'Publica y registra',
    description: 'Marca publicado cuando el video este en YouTube.',
    href: '/',
    action: 'Ir al dashboard',
    isDone: (counts) => counts.published > 0,
  },
];
