'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
    theme: ThemeMode;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const THEME_STORAGE_KEY = 'cronostudio_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const theme: ThemeMode = 'dark';

    useEffect(() => {
        if (typeof window === 'undefined') return;
        document.documentElement.dataset.theme = 'dark';
        localStorage.removeItem(THEME_STORAGE_KEY);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        // Modo oscuro fijo. No-op intencional.
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
