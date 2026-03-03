import { BarChart3, BookOpen, FileText, Image as ImageIcon, Lightbulb, Search, Tv, LayoutDashboard, Settings, Sparkles } from 'lucide-react';

export const NAV_LABELS = {
  dashboard: 'Dashboard',
  ideas: 'Ideas',
  scripts: 'Guiones',
  thumbnails: 'Miniaturas',
  seo: 'SEO',
  channels: 'Canales',
  analytics: 'Analitica',
  aiStudio: 'AI Studio',
  guide: 'Guia',
  settings: 'Configuracion',
  backToDashboard: 'Volver al dashboard',
  quickAccessTitle: 'Ir a:',
  logout: 'Salir',
  login: 'Iniciar Sesion',
  register: 'Registrarse',
  account: 'Mi cuenta',
} as const;

export const NAV_ITEMS = [
  { href: '/', label: NAV_LABELS.dashboard, icon: LayoutDashboard },
  { href: '/ideas', label: NAV_LABELS.ideas, icon: Lightbulb },
  { href: '/scripts', label: NAV_LABELS.scripts, icon: FileText },
  { href: '/thumbnails', label: NAV_LABELS.thumbnails, icon: ImageIcon },
  { href: '/seo', label: NAV_LABELS.seo, icon: Search },
  { href: '/channels', label: NAV_LABELS.channels, icon: Tv },
  { href: '/analytics', label: NAV_LABELS.analytics, icon: BarChart3 },
  { href: '/ai', label: NAV_LABELS.aiStudio, icon: Sparkles },
  { href: '/start', label: NAV_LABELS.guide, icon: BookOpen },
];

export const QUICK_LINKS = [
  { href: '/', label: NAV_LABELS.dashboard, icon: LayoutDashboard },
  { href: '/ideas', label: NAV_LABELS.ideas, icon: Lightbulb },
  { href: '/scripts', label: NAV_LABELS.scripts, icon: FileText },
  { href: '/thumbnails', label: NAV_LABELS.thumbnails, icon: ImageIcon },
  { href: '/seo', label: NAV_LABELS.seo, icon: Search },
  { href: '/channels', label: NAV_LABELS.channels, icon: Tv },
  { href: '/analytics', label: NAV_LABELS.analytics, icon: BarChart3 },
  { href: '/ai', label: NAV_LABELS.aiStudio, icon: Sparkles },
  { href: '/start', label: NAV_LABELS.guide, icon: BookOpen },
  { href: '/configuracion', label: NAV_LABELS.settings, icon: Settings },
];
