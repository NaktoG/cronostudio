'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User as DomainUser } from '@/domain/entities/User';

type UserRole = DomainUser['role'];

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    status: AuthStatus;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<{ message?: string; verificationUrl?: string }>;
    logout: () => void;
    error: string | null;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LAST_KNOWN_USER_KEY = 'cronostudio_user';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<AuthStatus>('loading');
    const [error, setError] = useState<string | null>(null);

    const saveSession = useCallback((newUser: User) => {
        const normalizedUser: User = {
            ...newUser,
            role: newUser.role ?? 'owner',
        };
        localStorage.setItem(LAST_KNOWN_USER_KEY, JSON.stringify(normalizedUser));
        setUser(normalizedUser);
        setStatus('authenticated');
    }, []);

    const clearSession = useCallback(() => {
        localStorage.removeItem(LAST_KNOWN_USER_KEY);
        setUser(null);
        setStatus('unauthenticated');
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
                clearSession();
            } finally {
                setStatus((current) => (current === 'loading' ? 'unauthenticated' : current));
            }
        };

        hydrateUser();
    }, [saveSession, clearSession]);

    const login = useCallback(async (email: string, password: string) => {
        setStatus('loading');
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
            setStatus('unauthenticated');
            throw err;
        }
    }, [saveSession]);

    const register = useCallback(async (email: string, password: string, name: string) => {
        setStatus('loading');
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
            setStatus('unauthenticated');
            return {
                message: data.message,
                verificationUrl: data.enlaceVerificacion,
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            setError(message);
            setStatus('unauthenticated');
            throw err;
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
        status,
        isLoading: status === 'loading',
        isAuthenticated: status === 'authenticated',
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
    return useCallback(async (input: RequestInfo, options: RequestInit = {}) => {
        let url = input;
        let baseOptions = options;

        if (input instanceof Request) {
            url = input.url;
            baseOptions = {
                method: input.method,
                headers: input.headers,
                body: input.body,
                ...options,
            };
        }

        const headers = new Headers(baseOptions.headers);
        if (!headers.has('Content-Type') && baseOptions.body && !(baseOptions.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }

        return fetch(url, {
            credentials: 'include',
            ...baseOptions,
            headers,
        });
    }, []);
}
