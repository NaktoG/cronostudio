'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User as DomainUser } from '@/domain/entities/User';
import { USER_ROLE_OWNER } from '@/domain/value-objects/UserRole';

type UserRole = DomainUser['role'];

interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    error: string | null;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = 'cronostudio_user';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const saveSession = useCallback((newUser: User) => {
        const normalizedUser: User = {
            ...newUser,
            role: newUser.role ?? USER_ROLE_OWNER,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
        setUser(normalizedUser);
    }, []);

    const clearSession = useCallback(() => {
        localStorage.removeItem(USER_KEY);
        setUser(null);
    }, []);

    useEffect(() => {
        const hydrateUser = async () => {
            try {
                const meResponse = await fetch('/api/auth/me', {
                    credentials: 'include',
                });
                if (meResponse.ok) {
                    const data = await meResponse.json();
                    saveSession(data.user);
                    return;
                }

                const refreshResponse = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({}),
                });
                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    saveSession(data.user);
                } else {
                    clearSession();
                }
            } catch {
                const storedUser = localStorage.getItem(USER_KEY);
                if (storedUser) {
                    try {
                        setUser(JSON.parse(storedUser));
                    } catch {
                        clearSession();
                    }
                }
            } finally {
                setIsLoading(false);
            }
        };

        hydrateUser();
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
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al iniciar sesión');
            }

            saveSession(data.user);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [saveSession]);

    const register = useCallback(async (email: string, password: string, name: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password, name }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al registrar usuario');
            }

            // Registro requiere verificación, no iniciamos sesión
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        }).finally(() => {
            clearSession();
        });
    }, [clearSession]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
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
    return useCallback(async (url: string, options: RequestInit = {}) => {
        const headers = new Headers(options.headers);
        if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }

        return fetch(url, {
            credentials: 'include',
            ...options,
            headers,
        });
    }, []);
}
