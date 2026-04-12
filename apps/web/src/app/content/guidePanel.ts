import type { Locale } from '@/app/i18n/messages';

type GuideTip = { title: string; description: string };
type GuideStep = { title: string; items: string[] };

const GUIDE_PANEL_COPY_BY_LOCALE: Record<Locale, {
  pageTips: Record<string, GuideTip>;
  pageSteps: Record<string, GuideStep>;
  flow: {
    connectChannel: { title: string; description: string; actionLabel: string };
    generateIdeas: { title: string; description: string; actionLabel: string };
    createScript: { title: string; description: string; actionLabel: string };
    optimizeSeo: { title: string; description: string; actionLabel: string };
    publishVideo: { title: string; description: string; actionLabel: string };
  };
  quickActions: Record<'channel' | 'ideas' | 'scripts' | 'seo' | 'publish', string>;
  panel: {
    modeLabel: string;
    nextStep: string;
    close: string;
    ideasReady: string;
    approveNow: string;
    checklistTitle: string;
    goIdeas: string;
    progress: string;
    inSection: string;
    updating: string;
    refresh: string;
    showLess: string;
    showAll: string;
    repeat: string;
    guideMe: string;
    completed: string;
    quickGuide: string;
    understood: string;
    goRecommended: string;
  };
}> = {
  es: {
    pageTips: {
      '/ai': { title: 'Crono', description: 'Usa perfiles para generar ideas, guiones, retencion y titulos aplicados.' },
      '/ideas': { title: 'Ideas', description: 'Refina ideas, aprueba viables y prepara el paso a guion.' },
      '/scripts': { title: 'Guiones', description: 'Verifica hook, estructura y duracion antes de marcar listo.' },
      '/seo': { title: 'SEO', description: 'Elige titulo final y asegura descripcion + tags consistentes.' },
      '/thumbnails': { title: 'Miniaturas', description: 'Define texto, variante y estado antes de publicar.' },
      '/channels': { title: 'Canales', description: 'Conecta YouTube y define el canal activo.' },
      '/': { title: 'Dashboard', description: 'Prioriza el flujo semanal y registra publicaciones.' },
      '/start': { title: 'Guia', description: 'Flujo recomendado con checkpoints y atajos.' },
    },
    pageSteps: {
      '/ai': {
        title: 'Crono paso a paso',
        items: [
          'Selecciona canal y perfil (Evergreen AI, Script Architect, Retention Editor, Titles & Thumbs).',
          'Completa el brief con contexto real del canal.',
          'Usa Generar y aplicar y valida el resultado.',
        ],
      },
      '/ideas': { title: 'Ideas paso a paso', items: ['Revisa ideas draft y ajusta el angulo.', 'Aprueba ideas con potencial evergreen.', 'Envia a guion desde Crono.'] },
      '/scripts': { title: 'Guiones paso a paso', items: ['Revisa hook, promesa y ritmo.', 'Marca listo cuando el guion este pulido.', 'Continua con SEO y miniaturas.'] },
      '/seo': { title: 'SEO paso a paso', items: ['Elige titulo final.', 'Asegura descripcion y tags.', 'Marca listo antes de publicar.'] },
      '/thumbnails': { title: 'Miniaturas paso a paso', items: ['Define texto de miniatura.', 'Sube o pega la URL final.', 'Aprueba antes de publicar.'] },
      '/channels': { title: 'Canales paso a paso', items: ['Crea o conecta canal.', 'Verifica nombre y datos.', 'Vuelve a Crono para generar ideas.'] },
      '/': { title: 'Dashboard paso a paso', items: ['Selecciona canal activo.', 'Revisa pipeline y backlog.', 'Publica cuando el video este listo.'] },
      '/start': { title: 'Guia paso a paso', items: ['Conecta canal y valida datos.', 'Genera ideas y aprueba.', 'Crea guion, SEO y publica.'] },
    },
    flow: {
      connectChannel: { title: 'Conecta tu canal', description: 'Crea o conecta tu canal para iniciar el flujo.', actionLabel: 'Ir a canales' },
      generateIdeas: { title: 'Genera ideas', description: 'Usa Crono para generar ideas evergreen.', actionLabel: 'Ir a Crono' },
      createScript: { title: 'Crea el guion', description: 'Transforma una idea en guion listo para grabar.', actionLabel: 'Crear guion' },
      optimizeSeo: { title: 'Optimiza SEO', description: 'Genera titulos, miniaturas y tags con AI.', actionLabel: 'Optimizar SEO' },
      publishVideo: { title: 'Publica el video', description: 'Marca publicado cuando el video ya esta en YouTube.', actionLabel: 'Ir al dashboard' },
    },
    quickActions: {
      channel: 'Crear canal',
      ideas: 'Crear idea',
      scripts: 'Crear guion',
      seo: 'Abrir SEO',
      publish: 'Abrir dashboard',
    },
    panel: {
      modeLabel: 'Modo guia',
      nextStep: 'Proximo paso recomendado',
      close: 'Cerrar',
      ideasReady: 'Tenes {n} ideas listas para aprobar.',
      approveNow: 'Aprobar ahora',
      checklistTitle: 'Checklist para aprobar',
      goIdeas: 'Ir a Ideas',
      progress: 'Progreso',
      inSection: 'En esta seccion',
      updating: 'Actualizando...',
      refresh: 'Actualizar guia',
      showLess: 'Ver menos',
      showAll: 'Ver todo',
      repeat: 'Repetir',
      guideMe: 'Guiame',
      completed: 'completados',
      quickGuide: 'Guia rapida',
      understood: 'Entendido',
      goRecommended: 'Ir al paso recomendado',
    },
  },
  en: {
    pageTips: {
      '/ai': { title: 'Crono', description: 'Use profiles to generate applied ideas, scripts, retention, and titles.' },
      '/ideas': { title: 'Ideas', description: 'Refine ideas, approve viable ones, and prepare the script handoff.' },
      '/scripts': { title: 'Scripts', description: 'Check hook, structure, and duration before marking ready.' },
      '/seo': { title: 'SEO', description: 'Pick the final title and ensure description + tags consistency.' },
      '/thumbnails': { title: 'Thumbnails', description: 'Define text, variant, and status before publishing.' },
      '/channels': { title: 'Channels', description: 'Connect YouTube and set the active channel.' },
      '/': { title: 'Dashboard', description: 'Prioritize weekly flow and register publications.' },
      '/start': { title: 'Guide', description: 'Recommended flow with checkpoints and shortcuts.' },
    },
    pageSteps: {
      '/ai': {
        title: 'Crono step by step',
        items: [
          'Select channel and profile (Evergreen AI, Script Architect, Retention Editor, Titles & Thumbs).',
          'Complete the brief with real channel context.',
          'Use Generate and apply, then validate the output.',
        ],
      },
      '/ideas': { title: 'Ideas step by step', items: ['Review draft ideas and adjust angle.', 'Approve ideas with evergreen potential.', 'Send to script from Crono.'] },
      '/scripts': { title: 'Scripts step by step', items: ['Review hook, promise, and pace.', 'Mark ready when script is polished.', 'Continue with SEO and thumbnails.'] },
      '/seo': { title: 'SEO step by step', items: ['Choose final title.', 'Ensure description and tags.', 'Mark ready before publishing.'] },
      '/thumbnails': { title: 'Thumbnails step by step', items: ['Define thumbnail text.', 'Upload or paste final URL.', 'Approve before publishing.'] },
      '/channels': { title: 'Channels step by step', items: ['Create or connect channel.', 'Verify name and data.', 'Return to Crono to generate ideas.'] },
      '/': { title: 'Dashboard step by step', items: ['Select active channel.', 'Review pipeline and backlog.', 'Publish when video is ready.'] },
      '/start': { title: 'Guide step by step', items: ['Connect channel and validate data.', 'Generate and approve ideas.', 'Create script, SEO, and publish.'] },
    },
    flow: {
      connectChannel: { title: 'Connect your channel', description: 'Create or connect your channel to start the flow.', actionLabel: 'Go to channels' },
      generateIdeas: { title: 'Generate ideas', description: 'Use Crono to generate evergreen ideas.', actionLabel: 'Go to Crono' },
      createScript: { title: 'Create script', description: 'Turn an idea into a script ready to record.', actionLabel: 'Create script' },
      optimizeSeo: { title: 'Optimize SEO', description: 'Generate titles, thumbnails, and tags with AI.', actionLabel: 'Optimize SEO' },
      publishVideo: { title: 'Publish video', description: 'Mark published when video is already on YouTube.', actionLabel: 'Go to dashboard' },
    },
    quickActions: {
      channel: 'Create channel',
      ideas: 'Create idea',
      scripts: 'Create script',
      seo: 'Open SEO',
      publish: 'Open dashboard',
    },
    panel: {
      modeLabel: 'Guide mode',
      nextStep: 'Recommended next step',
      close: 'Close',
      ideasReady: 'You have {n} ideas ready to approve.',
      approveNow: 'Approve now',
      checklistTitle: 'Approval checklist',
      goIdeas: 'Go to Ideas',
      progress: 'Progress',
      inSection: 'In this section',
      updating: 'Updating...',
      refresh: 'Refresh guide',
      showLess: 'Show less',
      showAll: 'Show all',
      repeat: 'Repeat',
      guideMe: 'Guide me',
      completed: 'completed',
      quickGuide: 'Quick guide',
      understood: 'Understood',
      goRecommended: 'Go to recommended step',
    },
  },
};

export function getGuidePanelCopy(locale: Locale) {
  return GUIDE_PANEL_COPY_BY_LOCALE[locale] ?? GUIDE_PANEL_COPY_BY_LOCALE.es;
}
