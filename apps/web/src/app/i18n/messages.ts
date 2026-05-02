export type Locale = 'es' | 'en';

export const DEFAULT_LOCALE: Locale = 'es';

interface Messages {
  [key: string]: string | Messages;
}

export const messages: Record<Locale, Messages> = {
  es: {
    common: {
      close: 'Cerrar',
      skipToMain: 'Saltar al contenido principal',
    },
    navigation: {
      dashboard: 'Dashboard',
      ideas: 'Ideas',
      scripts: 'Guiones',
      thumbnails: 'Miniaturas',
      seo: 'SEO',
      channels: 'Canales',
      analytics: 'Analítica',
      crono: 'Crono',
      guide: 'Guía',
      settings: 'Configuración',
      backToDashboard: 'Volver al dashboard',
      quickAccessTitle: 'Ir a:',
      logout: 'Salir',
      login: 'Iniciar sesión',
      register: 'Registrarse',
      account: 'Mi cuenta',
      admin: 'Admin',
      menu: 'Menú',
      startToday: 'Empieza hoy',
      startTodayDescription: 'Organiza tu producción y conecta YouTube.',
      createAccount: 'Crear cuenta',
      content: 'Contenido',
      channel: 'Canal',
    },
    header: {
      creativeStudio: 'Estudio creativo',
      guide: 'Guía',
      myAccount: 'Mi cuenta',
      notifications: 'Notificaciones',
      markAllRead: 'Marcar todas como leídas',
      loadingNotifications: 'Cargando notificaciones...',
      noNotifications: 'No hay notificaciones por ahora.',
      reminderSettings: 'Recordatorios',
      loadingReminderSettings: 'Cargando configuracion...',
      remindersEnabled: 'Activar recordatorios',
      remind24h: 'Avisar 24h antes',
      remind3h: 'Avisar 3h antes',
      remind30m: 'Avisar 30m antes',
      publishHourUtc: 'Hora objetivo UTC',
      timezone: 'Zona horaria',
      openMenu: 'Abrir menu',
      closeMenu: 'Cerrar menu',
    },
    shortcuts: {
      title: 'Atajos',
      subtitle: 'Navegación rápida',
      showShortcuts: 'Ver atajos',
      dashboard: 'Dashboard',
      ideas: 'Ideas',
      scripts: 'Guiones',
      thumbnails: 'Miniaturas',
      seo: 'SEO',
      crono: 'Crono',
      channels: 'Canales',
      guide: 'Guía',
    },
    locale: {
      label: 'Idioma',
      es: 'Español',
      en: 'Inglés',
    },
  },
  en: {
    common: {
      close: 'Close',
      skipToMain: 'Skip to main content',
    },
    navigation: {
      dashboard: 'Dashboard',
      ideas: 'Ideas',
      scripts: 'Scripts',
      thumbnails: 'Thumbnails',
      seo: 'SEO',
      channels: 'Channels',
      analytics: 'Analytics',
      crono: 'Crono',
      guide: 'Guide',
      settings: 'Settings',
      backToDashboard: 'Back to dashboard',
      quickAccessTitle: 'Go to:',
      logout: 'Log out',
      login: 'Log in',
      register: 'Sign up',
      account: 'My account',
      admin: 'Admin',
      menu: 'Menu',
      startToday: 'Start today',
      startTodayDescription: 'Organize your production and connect YouTube.',
      createAccount: 'Create account',
      content: 'Content',
      channel: 'Channel',
    },
    header: {
      creativeStudio: 'Creative studio',
      guide: 'Guide',
      myAccount: 'My account',
      notifications: 'Notifications',
      markAllRead: 'Mark all as read',
      loadingNotifications: 'Loading notifications...',
      noNotifications: 'No notifications yet.',
      reminderSettings: 'Reminders',
      loadingReminderSettings: 'Loading settings...',
      remindersEnabled: 'Enable reminders',
      remind24h: 'Notify 24h before',
      remind3h: 'Notify 3h before',
      remind30m: 'Notify 30m before',
      publishHourUtc: 'Target hour UTC',
      timezone: 'Timezone',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
    },
    shortcuts: {
      title: 'Shortcuts',
      subtitle: 'Quick navigation',
      showShortcuts: 'Show shortcuts',
      dashboard: 'Dashboard',
      ideas: 'Ideas',
      scripts: 'Scripts',
      thumbnails: 'Thumbnails',
      seo: 'SEO',
      crono: 'Crono',
      channels: 'Channels',
      guide: 'Guide',
    },
    locale: {
      label: 'Language',
      es: 'Spanish',
      en: 'English',
    },
  },
};

export function resolveMessage(locale: Locale, path: string): string {
  const sections = path.split('.');
  let current: string | Messages | undefined = messages[locale];
  for (const section of sections) {
    if (!current || typeof current === 'string') return path;
    current = current[section];
  }
  return typeof current === 'string' ? current : path;
}
