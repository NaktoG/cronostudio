'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useAuthFetch } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  action_href: string | null;
  metadata: {
    productionTitle?: string;
    targetDate?: string;
  };
  read_at: string | null;
  created_at: string;
};

type NotificationPreferences = {
  enabled: boolean;
  inAppEnabled: boolean;
  reminder24h: boolean;
  reminder3h: boolean;
  reminder30m: boolean;
  defaultHourUtc: number;
  defaultMinuteUtc: number;
  timezone: string;
};

const COMMON_TIMEZONES = [
  'UTC',
  'Europe/Madrid',
  'Europe/London',
  'America/Argentina/Buenos_Aires',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/New_York',
  'America/Los_Angeles',
] as const;

export default function NotificationCenter() {
  const authFetch = useAuthFetch();
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const unreadBadge = unreadCount > 99 ? '99+' : String(unreadCount);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch('/api/notifications?limit=8');
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return;
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const markAsRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      const response = await authFetch('/api/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setItems((prev) => prev.map((item) => (ids.includes(item.id) ? { ...item, read_at: new Date().toISOString() } : item)));
        if (typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
      }
    } catch {
      // silent fail to avoid interrupting navigation flow
    }
  };

  const markAllRead = async () => {
    try {
      const response = await authFetch('/api/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ markAll: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setItems((prev) => prev.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })));
        if (typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
      }
    } catch {
      // silent fail
    }
  };

  const loadPreferences = useCallback(async () => {
    setPreferencesLoading(true);
    try {
      const response = await authFetch('/api/notifications/preferences');
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.preferences) {
        setPreferences(data.preferences as NotificationPreferences);
      }
    } finally {
      setPreferencesLoading(false);
    }
  }, [authFetch]);

  const savePreferences = useCallback(async (next: NotificationPreferences) => {
    setSavingPreferences(true);
    try {
      const response = await authFetch('/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(next),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.preferences) {
        setPreferences(data.preferences as NotificationPreferences);
      }
    } finally {
      setSavingPreferences(false);
    }
  }, [authFetch]);

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 90000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return;
    if (!preferences) {
      void loadPreferences();
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [open, preferences, loadPreferences]);

  const visibleItems = useMemo(() => items.slice(0, 8), [items]);

  const timezoneOptions = useMemo(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const base: string[] = [...COMMON_TIMEZONES];
    if (detected && !base.includes(detected)) {
      base.unshift(detected);
    }
    return Array.from(new Set(base));
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-800 text-slate-300 hover:border-yellow-500/40 hover:text-yellow-300"
        aria-label={t('header.notifications')}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-yellow-400 px-1.5 py-0.5 text-[10px] font-semibold text-black">
            {unreadBadge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-[80] mt-2 w-[min(92vw,360px)] rounded-xl border border-gray-800 bg-gray-950/95 p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">{t('header.notifications')}</p>
            <button
              type="button"
              onClick={() => { void markAllRead(); }}
              className="text-xs text-slate-400 hover:text-yellow-300"
            >
              {t('header.markAllRead')}
            </button>
          </div>

          {loading && <p className="py-3 text-xs text-slate-400">{t('header.loadingNotifications')}</p>}

          {!loading && visibleItems.length === 0 && (
            <p className="py-3 text-xs text-slate-500">{t('header.noNotifications')}</p>
          )}

          {!loading && visibleItems.length > 0 && (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {visibleItems.map((item) => {
                const href = item.action_href || '/dashboard';
                const unread = !item.read_at;
                return (
                  <Link
                    key={item.id}
                    href={href}
                    onClick={() => {
                      if (unread) {
                        void markAsRead([item.id]);
                      }
                      setOpen(false);
                    }}
                    className={`block rounded-lg border px-3 py-2 transition-colors ${unread
                      ? 'border-yellow-500/30 bg-yellow-500/10 hover:border-yellow-400/50'
                      : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                      }`}
                  >
                    <p className="text-xs font-semibold text-white">{renderTitle(item, locale)}</p>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{renderBody(item, locale)}</p>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-3 border-t border-gray-800 pt-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{t('header.reminderSettings')}</p>

            {preferencesLoading && <p className="mt-2 text-xs text-slate-500">{t('header.loadingReminderSettings')}</p>}

            {!preferencesLoading && preferences && (
              <div className="mt-2 space-y-2">
                <label className="flex items-center justify-between gap-3 text-xs text-slate-300">
                  <span>{t('header.remindersEnabled')}</span>
                  <input
                    type="checkbox"
                    checked={preferences.enabled}
                    onChange={(event) => {
                      const next = { ...preferences, enabled: event.target.checked };
                      setPreferences(next);
                      void savePreferences(next);
                    }}
                    disabled={savingPreferences}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-xs text-slate-300">
                  <span>{t('header.remind24h')}</span>
                  <input
                    type="checkbox"
                    checked={preferences.reminder24h}
                    onChange={(event) => {
                      const next = { ...preferences, reminder24h: event.target.checked };
                      setPreferences(next);
                      void savePreferences(next);
                    }}
                    disabled={savingPreferences || !preferences.enabled}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-xs text-slate-300">
                  <span>{t('header.remind3h')}</span>
                  <input
                    type="checkbox"
                    checked={preferences.reminder3h}
                    onChange={(event) => {
                      const next = { ...preferences, reminder3h: event.target.checked };
                      setPreferences(next);
                      void savePreferences(next);
                    }}
                    disabled={savingPreferences || !preferences.enabled}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-xs text-slate-300">
                  <span>{t('header.remind30m')}</span>
                  <input
                    type="checkbox"
                    checked={preferences.reminder30m}
                    onChange={(event) => {
                      const next = { ...preferences, reminder30m: event.target.checked };
                      setPreferences(next);
                      void savePreferences(next);
                    }}
                    disabled={savingPreferences || !preferences.enabled}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-xs text-slate-300">
                  <span>{t('header.publishHourUtc')}</span>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={preferences.defaultHourUtc}
                    onChange={(event) => {
                      const parsed = Number.parseInt(event.target.value, 10);
                      const next = { ...preferences, defaultHourUtc: Number.isNaN(parsed) ? 18 : Math.min(23, Math.max(0, parsed)) };
                      setPreferences(next);
                      void savePreferences(next);
                    }}
                    className="w-16 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-right text-xs text-slate-200"
                    disabled={savingPreferences || !preferences.enabled}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-xs text-slate-300">
                  <span>{t('header.timezone')}</span>
                  <select
                    value={preferences.timezone}
                    onChange={(event) => {
                      const next = { ...preferences, timezone: event.target.value };
                      setPreferences(next);
                      void savePreferences(next);
                    }}
                    className="max-w-[180px] rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-slate-200"
                    disabled={savingPreferences || !preferences.enabled}
                  >
                    {timezoneOptions.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function renderTitle(item: NotificationItem, locale: 'es' | 'en'): string {
  if (item.type === 'upload_due_24h') return locale === 'en' ? 'Upload in 24 hours' : 'Subida en 24 horas';
  if (item.type === 'upload_due_3h') return locale === 'en' ? 'Upload in 3 hours' : 'Subida en 3 horas';
  if (item.type === 'upload_due_30m') return locale === 'en' ? 'Upload in 30 minutes' : 'Subida en 30 minutos';
  return item.title;
}

function renderBody(item: NotificationItem, locale: 'es' | 'en'): string {
  const productionTitle = item.metadata?.productionTitle || item.body || '';
  const targetDate = item.metadata?.targetDate;
  if (targetDate) {
    const formatted = new Date(`${targetDate}T00:00:00Z`).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-AR', {
      day: '2-digit',
      month: 'short',
    });
    return `${productionTitle} - ${formatted}`;
  }
  return productionTitle;
}
