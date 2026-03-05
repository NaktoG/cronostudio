'use client';

import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="border-t border-yellow-500/10 py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
                    <p className="text-slate-500 text-xs tracking-wide">
                        © {new Date().getFullYear()} CronoStudio
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
                        <Link href="/contacto" className="hover:text-yellow-300 transition-colors">Contacto</Link>
                        <span className="text-slate-600">•</span>
                        <Link href="/privacidad" className="hover:text-yellow-300 transition-colors">Política de privacidad</Link>
                        <span className="text-slate-600">•</span>
                        <Link href="/cookies" className="hover:text-yellow-300 transition-colors">Política de cookies</Link>
                        <span className="text-slate-600">•</span>
                        <Link href="/terminos" className="hover:text-yellow-300 transition-colors">Términos de servicio</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
