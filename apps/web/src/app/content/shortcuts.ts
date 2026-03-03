export type ShortcutItem = {
  id: string;
  label: string;
  keys: string;
  href?: string;
};

export const SHORTCUTS: ShortcutItem[] = [
  { id: 'dashboard', label: 'Dashboard', keys: 'Alt + D', href: '/' },
  { id: 'ideas', label: 'Ideas', keys: 'Alt + I', href: '/ideas' },
  { id: 'scripts', label: 'Guiones', keys: 'Alt + S', href: '/scripts' },
  { id: 'thumbnails', label: 'Miniaturas', keys: 'Alt + T', href: '/thumbnails' },
  { id: 'seo', label: 'SEO', keys: 'Alt + O', href: '/seo' },
  { id: 'ai', label: 'AI Studio', keys: 'Alt + A', href: '/ai' },
  { id: 'channels', label: 'Canales', keys: 'Alt + C', href: '/channels' },
  { id: 'guide', label: 'Guía', keys: 'Alt + G', href: '/start' },
  { id: 'help', label: 'Ver atajos', keys: '? (Shift + /)' },
];
