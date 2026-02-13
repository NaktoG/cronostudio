'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
    theme: ThemeMode;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const THEME_STORAGE_KEY = 'cronostudio_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<ThemeMode>(() => {
        if (typeof window === 'undefined') return 'dark';
        const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
        if (stored === 'light' || stored === 'dark') {
            return stored;
        }
        const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        return prefersLight ? 'light' : 'dark';
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
    }, []);

    const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme debe usarse dentro de ThemeProvider');
    }
    return context;
}
