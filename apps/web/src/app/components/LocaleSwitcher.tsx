'use client';

import { useLocale } from '@/app/contexts/LocaleContext';

interface LocaleSwitcherProps {
  variant?: 'toggle' | 'select';
}

export default function LocaleSwitcher({ variant = 'toggle' }: LocaleSwitcherProps) {
  const { locale, setLocale, t } = useLocale();

  if (variant === 'select') {
    return (
      <label className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/50 px-2 py-1.5 text-xs text-slate-300">
        <span className="uppercase tracking-[0.18em] text-[10px] text-slate-500">{t('locale.label')}</span>
        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value as 'es' | 'en')}
          className="bg-transparent text-xs text-slate-100 focus:outline-none"
          aria-label={t('locale.label')}
        >
          <option value="es">{t('locale.es')}</option>
          <option value="en">{t('locale.en')}</option>
        </select>
      </label>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900/50 p-1">
      <span className="px-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">{t('locale.label')}</span>
      <button
        type="button"
        onClick={() => setLocale('es')}
        className={`rounded px-2 py-1 text-xs ${locale === 'es' ? 'bg-yellow-400 text-black' : 'text-slate-300 hover:text-white'}`}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`rounded px-2 py-1 text-xs ${locale === 'en' ? 'bg-yellow-400 text-black' : 'text-slate-300 hover:text-white'}`}
      >
        EN
      </button>
    </div>
  );
}
