'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import type { User as DomainUser } from '@/domain/entities/User';
import { getAuthCopy } from '@/app/content/auth';
import type { Locale } from '@/app/i18n/messages';

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
const LOGOUT_MARKER_KEY = 'cronostudio_logout_marker';
const CSRF_COOKIE_NAME = 'csrf_token';

function getCurrentLocale(): Locale {
    if (typeof document === 'undefined') return 'es';
    return document.documentElement.lang.startsWith('en') ? 'en' : 'es';
}

function getCookieValue(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${name}=`));
    if (!match) return null;
    return decodeURIComponent(match.slice(name.length + 1));
}

function applyCsrfHeader(headers: Headers, method?: string) {
    const normalizedMethod = (method || 'GET').toUpperCase();
    if (normalizedMethod === 'GET' || normalizedMethod === 'HEAD' || normalizedMethod === 'OPTIONS') {
        return;
    }
    const csrfToken = getCookieValue(CSRF_COOKIE_NAME);
    if (csrfToken && !headers.has('x-csrf-token')) {
        headers.set('x-csrf-token', csrfToken);
    }
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<AuthStatus>('loading');
    const [error, setError] = useState<string | null>(null);
    const logoutInProgressRef = useRef(false);

    const saveSession = useCallback((newUser: User) => {
        if (logoutInProgressRef.current) {
            return;
        }
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
            if (typeof window !== 'undefined') {
                const marker = localStorage.getItem(LOGOUT_MARKER_KEY);
                if (marker) {
                    localStorage.removeItem(LOGOUT_MARKER_KEY);
                    clearSession();
                    setStatus('unauthenticated');
                    return;
                }
            }
            if (logoutInProgressRef.current) {
                setStatus('unauthenticated');
                return;
            }
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
                    headers: (() => {
                        const headers = new Headers({ 'Content-Type': 'application/json' });
                        applyCsrfHeader(headers, 'POST');
                        return headers;
                    })(),
                    credentials: 'include',
                    body: JSON.stringify({}),
                });
                if (logoutInProgressRef.current) {
                    clearSession();
                    return;
                }
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

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleStorage = (event: StorageEvent) => {
            if (event.key !== LOGOUT_MARKER_KEY) return;
            clearSession();
            setStatus('unauthenticated');
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [clearSession]);

    const login = useCallback(async (email: string, password: string) => {
        setStatus('loading');
        setError(null);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: (() => {
                    const headers = new Headers({ 'Content-Type': 'application/json' });
                    applyCsrfHeader(headers, 'POST');
                    return headers;
                })(),
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            const authCopy = getAuthCopy(getCurrentLocale());

            if (!response.ok) {
                throw new Error(data.error || authCopy.common.loginError);
            }

            saveSession(data.user);
        } catch (err) {
            const authCopy = getAuthCopy(getCurrentLocale());
            const message = err instanceof Error ? err.message : authCopy.common.unknownError;
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
                headers: (() => {
                    const headers = new Headers({ 'Content-Type': 'application/json' });
                    applyCsrfHeader(headers, 'POST');
                    return headers;
                })(),
                credentials: 'include',
                body: JSON.stringify({ email, password, name }),
            });

            const data = await response.json();
            const authCopy = getAuthCopy(getCurrentLocale());

            if (!response.ok) {
                throw new Error(data.error || authCopy.common.registerError);
            }

            // Registro requiere verificación, no iniciamos sesión
            setStatus('unauthenticated');
            return {
                message: data.message,
                verificationUrl: data.enlaceVerificacion,
            };
        } catch (err) {
            const authCopy = getAuthCopy(getCurrentLocale());
            const message = err instanceof Error ? err.message : authCopy.common.unknownError;
            setError(message);
            setStatus('unauthenticated');
            throw err;
        }
    }, []);

    const logout = useCallback(() => {
        logoutInProgressRef.current = true;
        if (typeof window !== 'undefined') {
            localStorage.setItem(LOGOUT_MARKER_KEY, String(Date.now()));
        }
        fetch('/api/auth/logout', {
            method: 'POST',
            headers: (() => {
                const headers = new Headers({ 'Content-Type': 'application/json' });
                applyCsrfHeader(headers, 'POST');
                return headers;
            })(),
            credentials: 'include',
        }).finally(() => {
            clearSession();
            if (typeof window !== 'undefined') {
                window.location.assign('/');
            }
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
        const method = (baseOptions.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
        if (!headers.has('Content-Type') && baseOptions.body && !(baseOptions.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }
        applyCsrfHeader(headers, method);

        try {
            const response = await fetch(url, {
                credentials: 'include',
                ...baseOptions,
                headers,
            });
            return response;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return new Response(null, { status: 204 });
            }

            return new Response(
                JSON.stringify({
                    error: 'network_error',
                    message: getAuthCopy(getCurrentLocale()).common.networkError,
                }),
                {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }
    }, []);
}
