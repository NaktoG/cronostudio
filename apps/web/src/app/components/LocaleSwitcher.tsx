'use client';

import { useLocale } from '@/app/contexts/LocaleContext';

export default function LocaleSwitcher() {
  const { locale, setLocale, t } = useLocale();

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
