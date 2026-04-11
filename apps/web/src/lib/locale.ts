import { cookies, headers } from 'next/headers';

import { DEFAULT_LOCALE, type Locale } from '@/app/i18n/messages';

const SUPPORTED_LOCALES: Locale[] = ['es', 'en'];

function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('en')) return 'en';
  return null;
}

export async function getInitialLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = normalizeLocale(cookieStore.get('crono_locale')?.value);
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    return cookieLocale;
  }

  const headerStore = await headers();
  const acceptLanguage = headerStore.get('accept-language');
  const firstLanguage = acceptLanguage?.split(',')[0];
  const parsed = normalizeLocale(firstLanguage);
  return parsed ?? DEFAULT_LOCALE;
}
