import type { Locale } from '@/app/i18n/messages';

type LandingCopy = {
  badge: string;
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  steps: Array<{ title: string; text: string }>;
  purpose: {
    title: string;
    description: string;
    bullets: string[];
  };
  howItWorks: {
    title: string;
    items: string[];
  };
  sections: {
    integrations: string;
    testimonials: string;
    newsletter: string;
    pricing: string;
  };
  integrations: string[];
  testimonials: Array<{ quote: string; name: string; role: string; photo: string }>;
  newsletter: {
    description: string;
    note: string;
    emailPlaceholder: string;
    subscribe: string;
  };
  pricing: {
    recommended: string;
    creatorPlanName: string;
    creatorPeriod: string;
    starterPlanName: string;
    starterPrice: string;
    creatorFeatures: string[];
    starterFeatures: string[];
    creatorCta: string;
    starterCta: string;
  };
};

const LANDING_COPY: Record<Locale, LandingCopy> = {
  es: {
    badge: 'Estudio creativo',
    title: 'La suite de produccion para creadores que publican con consistencia.',
    subtitle: 'CronoStudio integra ideas, guiones, miniaturas, SEO y analytics en un flujo unico con automatizaciones listas para escalar.',
    ctaPrimary: 'Crear cuenta',
    ctaSecondary: 'Iniciar sesion',
    steps: [
      { title: 'Conecta', text: 'Autoriza YouTube y define tu canal.' },
      { title: 'Planifica', text: 'Idea, guion, SEO y miniatura con flujo claro.' },
      { title: 'Automatiza', text: 'Sincroniza videos y analytics sin tocar APIs.' },
    ],
    purpose: {
      title: 'Para que sirve',
      description: 'Converti tu canal en un sistema: cada semana sabe que producir, cuando publicar y que medir.',
      bullets: [
        'Pipeline claro para ideas, guiones, SEO y miniaturas.',
        'Metricas semanales y alertas de disciplina.',
        'Automatizaciones para sincronizar contenido real.',
      ],
    },
    howItWorks: {
      title: 'Como funciona',
      items: [
        '1. Conectas YouTube con OAuth seguro.',
        '2. CronoStudio sincroniza videos y analytics.',
        '3. Planificas la semana con metas claras.',
      ],
    },
    sections: {
      integrations: 'Integraciones',
      testimonials: 'Testimonios',
      newsletter: 'Newsletter',
      pricing: 'Precios',
    },
    integrations: ['YouTube', 'Instagram', 'X / Twitter', 'LinkedIn', 'TikTok'],
    testimonials: [
      {
        quote: 'Deje de improvisar: ahora cada semana tengo claro que producir y cuando publicar.',
        name: 'Nati R.',
        role: 'Creadora de contenido',
        photo: '/imgs/aiony-haust-3TLl_97HNJo-unsplash.jpg',
      },
      {
        quote: 'El tablero y las alertas me ayudaron a sostener el ritmo sin quemarme.',
        name: 'Leo M.',
        role: 'Estratega de canales',
        photo: '/imgs/ian-dooley-d1UPkiFd04A-unsplash.jpg',
      },
      {
        quote: 'Conectar YouTube y ver analytics en un solo lugar cambio el juego.',
        name: 'Caro V.',
        role: 'Productora digital',
        photo: '/imgs/andres-mfWsMDdN-Ro-unsplash.jpg',
      },
      {
        quote: 'Pase de caos a una rutina clara. Ahora publico sin apagar incendios.',
        name: 'Juli P.',
        role: 'Creadora educativa',
        photo: '/imgs/rafaella-mendes-diniz-et_78QkMMQs-unsplash.jpg',
      },
    ],
    newsletter: {
      description: 'Recibi ideas, insights y actualizaciones del estudio creativo cada semana.',
      note: 'Sin spam. Solo contenido accionable.',
      emailPlaceholder: 'tu@email.com',
      subscribe: 'Suscribirme',
    },
    pricing: {
      recommended: 'Recomendado',
      creatorPlanName: 'Creator Pro',
      creatorPeriod: '/mes',
      starterPlanName: 'Starter',
      starterPrice: 'Gratis',
      creatorFeatures: [
        'Pipeline completo + panel de produccion',
        'Sync con YouTube y analytics diario',
        'Alertas semanales y objetivos',
      ],
      starterFeatures: [
        'Ideas y guiones esenciales',
        'Tablero de produccion basico',
        '1 canal conectado',
      ],
      creatorCta: 'Empezar ahora',
      starterCta: 'Crear cuenta',
    },
  },
  en: {
    badge: 'Creative studio',
    title: 'The production suite for creators who publish consistently.',
    subtitle: 'CronoStudio unifies ideas, scripts, thumbnails, SEO, and analytics into a single workflow with scalable automation.',
    ctaPrimary: 'Create account',
    ctaSecondary: 'Sign in',
    steps: [
      { title: 'Connect', text: 'Authorize YouTube and define your channel.' },
      { title: 'Plan', text: 'Ideas, script, SEO, and thumbnail with a clear workflow.' },
      { title: 'Automate', text: 'Sync videos and analytics without touching APIs.' },
    ],
    purpose: {
      title: 'What it does',
      description: 'Turn your channel into a system: each week you know what to produce, when to publish, and what to measure.',
      bullets: [
        'Clear pipeline for ideas, scripts, SEO, and thumbnails.',
        'Weekly metrics and discipline alerts.',
        'Automations to sync real content state.',
      ],
    },
    howItWorks: {
      title: 'How it works',
      items: [
        '1. Connect YouTube with secure OAuth.',
        '2. CronoStudio syncs videos and analytics.',
        '3. Plan your week with clear goals.',
      ],
    },
    sections: {
      integrations: 'Integrations',
      testimonials: 'Testimonials',
      newsletter: 'Newsletter',
      pricing: 'Pricing',
    },
    integrations: ['YouTube', 'Instagram', 'X / Twitter', 'LinkedIn', 'TikTok'],
    testimonials: [
      {
        quote: 'I stopped improvising: now every week I know what to produce and when to publish.',
        name: 'Nati R.',
        role: 'Content creator',
        photo: '/imgs/aiony-haust-3TLl_97HNJo-unsplash.jpg',
      },
      {
        quote: 'The dashboard and alerts helped me keep pace without burning out.',
        name: 'Leo M.',
        role: 'Channel strategist',
        photo: '/imgs/ian-dooley-d1UPkiFd04A-unsplash.jpg',
      },
      {
        quote: 'Connecting YouTube and seeing analytics in one place changed everything.',
        name: 'Caro V.',
        role: 'Digital producer',
        photo: '/imgs/andres-mfWsMDdN-Ro-unsplash.jpg',
      },
      {
        quote: 'I moved from chaos to a clear routine. Now I publish without constant firefighting.',
        name: 'Juli P.',
        role: 'Education creator',
        photo: '/imgs/rafaella-mendes-diniz-et_78QkMMQs-unsplash.jpg',
      },
    ],
    newsletter: {
      description: 'Receive ideas, insights, and studio updates every week.',
      note: 'No spam. Only actionable content.',
      emailPlaceholder: 'you@email.com',
      subscribe: 'Subscribe',
    },
    pricing: {
      recommended: 'Recommended',
      creatorPlanName: 'Creator Pro',
      creatorPeriod: '/month',
      starterPlanName: 'Starter',
      starterPrice: 'Free',
      creatorFeatures: [
        'Full pipeline + production dashboard',
        'YouTube sync and daily analytics',
        'Weekly alerts and targets',
      ],
      starterFeatures: [
        'Core ideas and scripts',
        'Basic production board',
        '1 connected channel',
      ],
      creatorCta: 'Get started',
      starterCta: 'Create account',
    },
  },
};

export function getLandingCopy(locale: Locale): LandingCopy {
  return LANDING_COPY[locale] ?? LANDING_COPY.es;
}
