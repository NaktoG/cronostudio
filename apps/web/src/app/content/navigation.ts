import { BarChart3, BookOpen, FileText, Image as ImageIcon, Lightbulb, Search, Tv, LayoutDashboard, Settings, Sparkles } from 'lucide-react';

export const NAV_LABEL_KEYS = {
  dashboard: 'navigation.dashboard',
  ideas: 'navigation.ideas',
  scripts: 'navigation.scripts',
  thumbnails: 'navigation.thumbnails',
  seo: 'navigation.seo',
  channels: 'navigation.channels',
  analytics: 'navigation.analytics',
  crono: 'navigation.crono',
  guide: 'navigation.guide',
  settings: 'navigation.settings',
  backToDashboard: 'navigation.backToDashboard',
  quickAccessTitle: 'navigation.quickAccessTitle',
  logout: 'navigation.logout',
  login: 'navigation.login',
  register: 'navigation.register',
  account: 'navigation.account',
} as const;

export const NAV_ITEMS = [
  { href: '/dashboard', labelKey: NAV_LABEL_KEYS.dashboard, icon: LayoutDashboard },
  { href: '/ideas', labelKey: NAV_LABEL_KEYS.ideas, icon: Lightbulb },
  { href: '/scripts', labelKey: NAV_LABEL_KEYS.scripts, icon: FileText },
  { href: '/thumbnails', labelKey: NAV_LABEL_KEYS.thumbnails, icon: ImageIcon },
  { href: '/seo', labelKey: NAV_LABEL_KEYS.seo, icon: Search },
  { href: '/channels', labelKey: NAV_LABEL_KEYS.channels, icon: Tv },
  { href: '/analytics', labelKey: NAV_LABEL_KEYS.analytics, icon: BarChart3 },
  { href: '/ai', labelKey: NAV_LABEL_KEYS.crono, icon: Sparkles },
];

export const QUICK_LINKS = [
  { href: '/dashboard', labelKey: NAV_LABEL_KEYS.dashboard, icon: LayoutDashboard },
  { href: '/ideas', labelKey: NAV_LABEL_KEYS.ideas, icon: Lightbulb },
  { href: '/scripts', labelKey: NAV_LABEL_KEYS.scripts, icon: FileText },
  { href: '/thumbnails', labelKey: NAV_LABEL_KEYS.thumbnails, icon: ImageIcon },
  { href: '/seo', labelKey: NAV_LABEL_KEYS.seo, icon: Search },
  { href: '/channels', labelKey: NAV_LABEL_KEYS.channels, icon: Tv },
  { href: '/analytics', labelKey: NAV_LABEL_KEYS.analytics, icon: BarChart3 },
  { href: '/ai', labelKey: NAV_LABEL_KEYS.crono, icon: Sparkles },
  { href: '/start', labelKey: NAV_LABEL_KEYS.guide, icon: BookOpen },
  { href: '/configuracion', labelKey: NAV_LABEL_KEYS.settings, icon: Settings },
];
