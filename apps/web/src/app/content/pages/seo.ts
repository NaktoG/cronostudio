import type { Locale } from '@/app/i18n/messages';

const SEO_COPY_BY_LOCALE = {
  es: {
    title: 'SEO',
    subtitle: 'Optimizacion de titulos, descripciones y tags para YouTube',
    emptyTitle: 'No hay datos SEO todavia',
    emptySubtitle: 'Los datos SEO se crean automaticamente cuando subes un video',
    emptyHint: 'Tambien puedes usar n8n para generar SEO automaticamente',
    connectChannel: 'Conectar canal',
    viewAnalytics: 'Ver analytics',
    sectionTitle: 'SEO por contenido',
    controls: {
      channel: 'Canal',
      allChannels: 'Todos los canales',
      selectedCount: 'seleccionados',
      copyTitles: 'Copiar titulos',
      copyDescriptions: 'Copiar descripciones',
      copyTags: 'Copiar tags',
      clear: 'Limpiar',
      retry: 'Reintentar',
      selectPrefix: 'Seleccionar SEO',
      select: 'Seleccionar',
      copyTitle: 'Copiar titulo',
      copyDescription: 'Copiar descripcion',
      copyTagsSingle: 'Copiar tags',
      ideaIdPlaceholder: 'Idea ID',
      scriptIdPlaceholder: 'Script ID',
      moreSuffix: 'mas',
    },
    presets: {
      hide: 'Ocultar presets',
      show: 'Ver presets',
      suggestedTitles: 'Titulos sugeridos',
      thumbnailTexts: 'Textos de miniatura',
    },
    tipsTitle: 'Consejos SEO para YouTube',
    tips: [
      { title: 'Titulo', description: '30-60 caracteres, palabra clave al inicio' },
      { title: 'Descripcion', description: '100-500 caracteres, links y CTAs incluidos' },
      { title: 'Tags', description: '5-15 tags relevantes y especificos' },
    ],
    score: {
      excellent: 'Excelente',
      good: 'Bueno',
      ok: 'Mejorable',
      bad: 'Necesita trabajo',
    },
    scoreLabel: 'Score SEO',
    videoPrefix: 'Video:',
    toasts: {
      copied: 'Copiado al portapapeles',
      error: 'No se pudo copiar',
    },
    errors: {
      load: 'Error al cargar SEO',
      unknown: 'Error',
    },
  },
  en: {
    title: 'SEO',
    subtitle: 'Optimize YouTube titles, descriptions, and tags',
    emptyTitle: 'No SEO data yet',
    emptySubtitle: 'SEO data is generated automatically when you upload a video',
    emptyHint: 'You can also use n8n to generate SEO automatically',
    connectChannel: 'Connect channel',
    viewAnalytics: 'View analytics',
    sectionTitle: 'SEO by content',
    controls: {
      channel: 'Channel',
      allChannels: 'All channels',
      selectedCount: 'selected',
      copyTitles: 'Copy titles',
      copyDescriptions: 'Copy descriptions',
      copyTags: 'Copy tags',
      clear: 'Clear',
      retry: 'Retry',
      selectPrefix: 'Select SEO',
      select: 'Select',
      copyTitle: 'Copy title',
      copyDescription: 'Copy description',
      copyTagsSingle: 'Copy tags',
      ideaIdPlaceholder: 'Idea ID',
      scriptIdPlaceholder: 'Script ID',
      moreSuffix: 'more',
    },
    presets: {
      hide: 'Hide presets',
      show: 'View presets',
      suggestedTitles: 'Suggested titles',
      thumbnailTexts: 'Thumbnail texts',
    },
    tipsTitle: 'SEO tips for YouTube',
    tips: [
      { title: 'Title', description: '30-60 characters, keyword at the beginning' },
      { title: 'Description', description: '100-500 characters, include links and CTAs' },
      { title: 'Tags', description: '5-15 relevant and specific tags' },
    ],
    score: {
      excellent: 'Excellent',
      good: 'Good',
      ok: 'Acceptable',
      bad: 'Needs work',
    },
    scoreLabel: 'SEO score',
    videoPrefix: 'Video:',
    toasts: {
      copied: 'Copied to clipboard',
      error: 'Could not copy',
    },
    errors: {
      load: 'Error loading SEO',
      unknown: 'Error',
    },
  },
} as const;

export function getSeoCopy(locale: Locale) {
  return SEO_COPY_BY_LOCALE[locale] ?? SEO_COPY_BY_LOCALE.es;
}

export type SeoCopy = ReturnType<typeof getSeoCopy>;
export const SEO_COPY = getSeoCopy('es');
