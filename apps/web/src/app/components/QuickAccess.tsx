'use client';

import Link from 'next/link';

const QUICK_LINKS = [
    { href: '/ideas', icon: '💡', label: 'Ideas' },
    { href: '/scripts', icon: '📝', label: 'Guiones' },
    { href: '/thumbnails', icon: '🖼️', label: 'Miniaturas' },
    { href: '/videos', icon: '🎬', label: 'Producción' },
    { href: '/seo', icon: '🔍', label: 'SEO' },
    { href: '/channels', icon: '📺', label: 'Canales' },
    { href: '/analytics', icon: '📊', label: 'Analytics' },
    { href: 'http://localhost:8080/?pgsql=postgres&username=cronostudio&db=cronostudio&ns=public', icon: '🗄️', label: 'Base de Datos', external: true },
];

export default function QuickAccess() {
    return (
        <div className="flex items-center gap-1 py-2">
            <span className="text-[10px] text-gray-600 mr-2">Ir a:</span>
            {QUICK_LINKS.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-800/60 transition-colors text-gray-400 hover:text-white"
                    title={link.label}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                >
                    <span className="text-sm">{link.icon}</span>
                    <span className="text-[10px] hidden sm:inline">{link.label}</span>
                </Link>
            ))}
        </div>
    );
}
