'use client';

import Link from 'next/link';
import {
    BarChart3,
    Database,
    Film,
    FileText,
    Image as ImageIcon,
    Lightbulb,
    Search,
    Tv,
} from 'lucide-react';

const QUICK_LINKS = [
    { href: '/ideas', icon: Lightbulb, label: 'Ideas' },
    { href: '/scripts', icon: FileText, label: 'Guiones' },
    { href: '/thumbnails', icon: ImageIcon, label: 'Miniaturas' },
    { href: '/videos', icon: Film, label: 'Produccion' },
    { href: '/seo', icon: Search, label: 'SEO' },
    { href: '/channels', icon: Tv, label: 'Canales' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: 'http://localhost:8080/?pgsql=postgres&username=cronostudio&db=cronostudio&ns=public', icon: Database, label: 'Base de Datos', external: true },
];

export default function QuickAccess() {
    return (
        <div className="flex items-center gap-1 py-2">
            <span className="text-[10px] text-slate-500 mr-2">Ir a:</span>
            {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
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
