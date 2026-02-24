'use client';

import Link from 'next/link';
import { Film } from 'lucide-react';
import { NAV_LABELS, QUICK_LINKS } from '../content/navigation';

export default function QuickAccess() {
    return (
        <div className="flex items-center gap-1 py-2">
            <span className="text-[10px] text-slate-500 mr-2">{NAV_LABELS.quickAccessTitle}</span>
            {QUICK_LINKS.map((link) => {
                const Icon = link.icon || Film;
                return (
                <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-800/60 transition-colors text-slate-400 hover:text-white"
                    title={link.label}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[10px] hidden sm:inline">{link.label}</span>
                </Link>
                );
            })}
        </div>
    );
}
