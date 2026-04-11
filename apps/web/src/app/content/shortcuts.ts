export type ShortcutItem = {
  id: string;
  labelKey: string;
  keys: string;
  href?: string;
};

export const SHORTCUTS: ShortcutItem[] = [
  { id: 'dashboard', labelKey: 'shortcuts.dashboard', keys: 'Alt + D', href: '/' },
  { id: 'ideas', labelKey: 'shortcuts.ideas', keys: 'Alt + I', href: '/ideas' },
  { id: 'scripts', labelKey: 'shortcuts.scripts', keys: 'Alt + S', href: '/scripts' },
  { id: 'thumbnails', labelKey: 'shortcuts.thumbnails', keys: 'Alt + T', href: '/thumbnails' },
  { id: 'seo', labelKey: 'shortcuts.seo', keys: 'Alt + O', href: '/seo' },
  { id: 'ai', labelKey: 'shortcuts.crono', keys: 'Alt + A', href: '/ai' },
  { id: 'channels', labelKey: 'shortcuts.channels', keys: 'Alt + C', href: '/channels' },
  { id: 'guide', labelKey: 'shortcuts.guide', keys: 'Alt + G', href: '/start' },
  { id: 'help', labelKey: 'shortcuts.showShortcuts', keys: '? (Shift + /)' },
];
