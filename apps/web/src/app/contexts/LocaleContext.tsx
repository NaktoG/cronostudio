'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { DEFAULT_LOCALE, type Locale, resolveMessage } from '@/app/i18n/messages';

const LOCALE_COOKIE = 'crono_locale';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale: (nextLocale: Locale) => {
      setLocaleState(nextLocale);
      setLocaleCookie(nextLocale);
    },
    t: (path: string) => resolveMessage(locale, path),
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => undefined,
      t: (path: string) => resolveMessage(DEFAULT_LOCALE, path),
    };
  }
  return context;
}
