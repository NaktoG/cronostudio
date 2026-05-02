import type { Locale } from '@/app/i18n/messages';

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

const STEPS_BY_LOCALE: Record<string, Omit<OnboardingStepDefinition, 'isDone'>[]> = {
  es: [
    { id: 'channel', title: 'Conecta tu canal', description: 'Crea o conecta tu canal para que todo quede asociado.', href: '/channels', action: 'Ir a canales' },
    { id: 'ideas', title: 'Genera ideas', description: 'En AI Studio usa evergreen_ideas y genera 10 ideas aplicadas.', href: '/ai', action: 'Abrir AI Studio' },
    { id: 'ideas-approve', title: 'Aprueba ideas', description: 'Pulí las ideas y marcá las listas para pasar a guion.', href: '/ideas', action: 'Ver ideas' },
    { id: 'scripts', title: 'Crea el guion', description: 'Usa script_architect para generar el guion completo.', href: '/ai', action: 'Generar guion' },
    { id: 'seo', title: 'Optimiza SEO', description: 'Genera títulos, miniaturas y tags con titles_thumbs.', href: '/ai', action: 'Optimizar SEO' },
    { id: 'thumbnails', title: 'Aprueba miniatura', description: 'Definí el texto/imagen final antes de publicar.', href: '/thumbnails', action: 'Ver miniaturas' },
    { id: 'publish', title: 'Publica y registra', description: 'Marca publicado cuando el video esté en YouTube.', href: '/', action: 'Ir al dashboard' },
  ],
  en: [
    { id: 'channel', title: 'Connect your channel', description: 'Create or connect your channel so everything is linked.', href: '/channels', action: 'Go to channels' },
    { id: 'ideas', title: 'Generate ideas', description: 'In AI Studio use evergreen_ideas to generate 10 applied ideas.', href: '/ai', action: 'Open AI Studio' },
    { id: 'ideas-approve', title: 'Approve ideas', description: 'Refine ideas and mark them ready for scripting.', href: '/ideas', action: 'View ideas' },
    { id: 'scripts', title: 'Create the script', description: 'Use script_architect to generate the full script.', href: '/ai', action: 'Generate script' },
    { id: 'seo', title: 'Optimize SEO', description: 'Generate titles, thumbnails and tags with titles_thumbs.', href: '/ai', action: 'Optimize SEO' },
    { id: 'thumbnails', title: 'Approve thumbnail', description: 'Define the final text/image before publishing.', href: '/thumbnails', action: 'View thumbnails' },
    { id: 'publish', title: 'Publish and record', description: 'Mark as published when the video is live on YouTube.', href: '/', action: 'Go to dashboard' },
  ],
};

const STEP_CHECKS: Record<string, (counts: OnboardingCounts) => boolean> = {
  channel: (c) => c.channels > 0,
  ideas: (c) => c.ideas > 0,
  'ideas-approve': (c) => c.ideasApproved > 0,
  scripts: (c) => c.scriptsReady > 0 || c.scripts > 0,
  seo: (c) => c.seo > 0,
  thumbnails: (c) => c.thumbnailsApproved > 0,
  publish: (c) => c.published > 0,
};

export function getOnboardingSteps(locale: Locale): OnboardingStepDefinition[] {
  const steps = STEPS_BY_LOCALE[locale] ?? STEPS_BY_LOCALE.es;
  return steps.map((step) => ({
    ...step,
    isDone: STEP_CHECKS[step.id] ?? (() => false),
  }));
}

export const ONBOARDING_STEPS = getOnboardingSteps('es');
