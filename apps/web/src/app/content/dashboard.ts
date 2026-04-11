import type { Locale } from '@/app/i18n/messages';

const DASHBOARD_COPY_BY_LOCALE = {
  es: {
    header: {
      tag: 'Control de produccion',
      title: 'Hoy en tu produccion',
      subtitle: 'Tu centro de comando para planificar, producir y publicar contenido con claridad.',
      newContent: 'Nuevo contenido',
    },
    loading: {
      dashboard: 'Cargando dashboard...',
    },
    summary: {
      title: 'Resumen',
      total: 'Total',
      totalSubtitle: 'Total en produccion',
      active: 'Activos',
      activeSubtitle: 'En curso',
      ideas: 'Ideas',
      ideasSubtitle: 'Ideas registradas',
      published: 'Publicados',
      publishedSubtitle: 'Publicado hasta hoy',
    },
    pipeline: {
      inStage: 'Contenidos en esta etapa',
      active: 'Contenidos activos',
      ideasActive: 'Ideas activas',
      noIdeas: 'No hay ideas activas.',
      ideasCountLabel: 'ideas',
    },
    priorityActions: {
      script: 'Continuar guion',
      thumbnail: 'Subir miniatura',
      seo: 'Optimizar SEO',
      shorts: 'Crear shorts',
    },
    calendar: {
      title: 'Calendario',
      subtitle: 'Programa publicaciones',
      month: 'Mes',
      week: 'Semana',
      schedule: 'Programar',
      selectContent: 'Selecciona contenido',
      scheduleAction: 'Programar publicacion',
      clear: 'Limpiar',
      agenda: 'Agenda',
      emptyDay: 'Sin publicaciones para este dia.',
      emptyUpcoming: 'Sin publicaciones programadas.',
      reschedule: 'Reprogramar',
      cancel: 'Cancelar',
      weekdays: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
    },
    context: {
      title: 'Contexto',
      channel: 'Canal',
      selectChannel: 'Selecciona un canal',
      noChannels: 'Sin canales disponibles',
      isoWeek: 'Semana ISO',
      goal: 'Meta semanal',
      videos: 'videos',
      published: 'Publicados',
      defaultChannel: 'Canal por defecto',
    },
    social: {
      title: 'Redes sociales',
      connect: 'Conectar',
      items: [
        { name: 'Instagram', description: 'Reels, posts y stories' },
        { name: 'TikTok', description: 'Clips cortos y trends' },
        { name: 'LinkedIn', description: 'Posts, clips y branding' },
        { name: 'X', description: 'Hilos y anuncios' },
      ],
    },
    weeklyStatus: {
      title: 'Estado semanal',
      next: 'Proxima condicion critica',
      noNext: 'Semana completa o sin pendientes',
      channel: 'Canal',
    },
    weeklyStreak: {
      title: 'Indicador de ritmo',
      current: 'Racha actual',
      best: 'Mejor racha',
    },
    modal: {
      title: 'Nuevo contenido',
      placeholder: 'Titulo del contenido...',
      cancel: 'Cancelar',
      create: 'Crear contenido',
    },
    fab: {
      label: 'Nuevo',
    },
    toasts: {
      created: 'Contenido creado',
      createError: 'Error al crear contenido',
      createFailed: 'No se pudo crear contenido',
      scheduled: 'Publicacion programada',
      scheduleError: 'Error al programar publicacion',
      canceled: 'Publicacion cancelada',
      cancelError: 'Error al cancelar publicacion',
    },
    stageLabels: {
      idea: 'Ideas',
      scripting: 'Guiones',
      recording: 'Grabacion',
      editing: 'Edicion',
      shorts: 'Shorts',
      publishing: 'Publicacion',
      published: 'Publicado',
    },
  },
  en: {
    header: {
      tag: 'Production control',
      title: 'Today in your production',
      subtitle: 'Your command center to plan, produce, and publish content with clarity.',
      newContent: 'New content',
    },
    loading: {
      dashboard: 'Loading dashboard...',
    },
    summary: {
      title: 'Summary',
      total: 'Total',
      totalSubtitle: 'Total in production',
      active: 'Active',
      activeSubtitle: 'In progress',
      ideas: 'Ideas',
      ideasSubtitle: 'Registered ideas',
      published: 'Published',
      publishedSubtitle: 'Published to date',
    },
    pipeline: {
      inStage: 'Content in this stage',
      active: 'Active content',
      ideasActive: 'Active ideas',
      noIdeas: 'No active ideas.',
      ideasCountLabel: 'ideas',
    },
    priorityActions: {
      script: 'Continue script',
      thumbnail: 'Upload thumbnail',
      seo: 'Optimize SEO',
      shorts: 'Create shorts',
    },
    calendar: {
      title: 'Calendar',
      subtitle: 'Schedule publications',
      month: 'Month',
      week: 'Week',
      schedule: 'Schedule',
      selectContent: 'Select content',
      scheduleAction: 'Schedule publication',
      clear: 'Clear',
      agenda: 'Agenda',
      emptyDay: 'No publications for this day.',
      emptyUpcoming: 'No scheduled publications.',
      reschedule: 'Reschedule',
      cancel: 'Cancel',
      weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    },
    context: {
      title: 'Context',
      channel: 'Channel',
      selectChannel: 'Select a channel',
      noChannels: 'No channels available',
      isoWeek: 'ISO Week',
      goal: 'Weekly goal',
      videos: 'videos',
      published: 'Published',
      defaultChannel: 'Default channel',
    },
    social: {
      title: 'Social media',
      connect: 'Connect',
      items: [
        { name: 'Instagram', description: 'Reels, posts, and stories' },
        { name: 'TikTok', description: 'Short clips and trends' },
        { name: 'LinkedIn', description: 'Posts, clips, and branding' },
        { name: 'X', description: 'Threads and announcements' },
      ],
    },
    weeklyStatus: {
      title: 'Weekly status',
      next: 'Next critical condition',
      noNext: 'Week complete or no pending items',
      channel: 'Channel',
    },
    weeklyStreak: {
      title: 'Pace indicator',
      current: 'Current streak',
      best: 'Best streak',
    },
    modal: {
      title: 'New content',
      placeholder: 'Content title...',
      cancel: 'Cancel',
      create: 'Create content',
    },
    fab: {
      label: 'New',
    },
    toasts: {
      created: 'Content created',
      createError: 'Error creating content',
      createFailed: 'Unable to create content',
      scheduled: 'Publication scheduled',
      scheduleError: 'Error scheduling publication',
      canceled: 'Publication canceled',
      cancelError: 'Error canceling publication',
    },
    stageLabels: {
      idea: 'Ideas',
      scripting: 'Scripts',
      recording: 'Recording',
      editing: 'Editing',
      shorts: 'Shorts',
      publishing: 'Publishing',
      published: 'Published',
    },
  },
} as const;

export function getDashboardCopy(locale: Locale) {
  return DASHBOARD_COPY_BY_LOCALE[locale] ?? DASHBOARD_COPY_BY_LOCALE.es;
}

export function getStageLabels(locale: Locale) {
  return getDashboardCopy(locale).stageLabels;
}

export const DASHBOARD_COPY = getDashboardCopy('es');
export const STAGE_LABELS = getStageLabels('es');
