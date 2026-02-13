'use client';

import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const label = isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';

    return (
        <button
            type="button"
            aria-pressed={!isDark}
            aria-label={label}
            onClick={toggleTheme}
            className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-lg backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            style={{
                backgroundColor: 'var(--surface)',
                color: 'var(--foreground)',
                borderColor: 'var(--border-color)'
            }}
        >
            <span aria-hidden="true">{isDark ? '🌙' : '☀️'}</span>
            <span className="hidden sm:inline">{isDark ? 'Modo oscuro' : 'Modo claro'}</span>
        </button>
    );
}
