'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    error: string | null;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'cronostudio_token';
const REFRESH_TOKEN_KEY = 'cronostudio_refresh_token';
const USER_KEY = 'cronostudio_user';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Cargar sesión desde localStorage al iniciar
    const saveSession = useCallback((newToken: string, newUser: User, newRefreshToken: string) => {
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    }, []);

    const clearSession = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(REFRESH_TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
            }
            setIsLoading(false);
            return;
        }

        if (storedRefreshToken) {
            fetch('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: storedRefreshToken }),
            })
                .then(async (res) => {
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Error al refrescar sesion');
                    saveSession(data.token, data.user, data.refreshToken);
                })
                .catch(() => {
                    clearSession();
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, [saveSession, clearSession]);

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al iniciar sesión');
            }

            saveSession(data.token, data.user, data.refreshToken);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (email: string, password: string, name: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, name }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al registrar usuario');
            }

            saveSession(data.token, data.user, data.refreshToken);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
            fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            }).finally(() => {
                clearSession();
            });
        } else {
            clearSession();
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        error,
        clearError,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}

// Hook para hacer fetch autenticado
export function useAuthFetch() {
    const { token } = useAuth();

    return useCallback(
        async (url: string, options: RequestInit = {}) => {
            const headers = new Headers(options.headers);

            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }

            return fetch(url, {
                ...options,
                headers,
            });
        },
        [token]
    );
}
