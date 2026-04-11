'use client';

import Link from 'next/link';
import { Film } from 'lucide-react';
import { QUICK_LINKS } from '../content/navigation';
import { useLocale } from '@/app/contexts/LocaleContext';

export default function QuickAccess() {
    const { t } = useLocale();

    return (
        <div className="flex flex-wrap items-center gap-1.5 py-2">
            <span className="text-[10px] text-slate-500 mr-1 sm:mr-2">{t('navigation.quickAccessTitle')}</span>
            {QUICK_LINKS.map((link) => {
                const Icon = link.icon || Film;
                const isExternal = 'external' in link && Boolean(link.external);
                const label = t(link.labelKey);
                return (
                <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-800/60 transition-colors text-slate-400 hover:text-white"
                    title={label}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[10px] hidden sm:inline">{label}</span>
                </Link>
                );
            })}
        </div>
    );
}
