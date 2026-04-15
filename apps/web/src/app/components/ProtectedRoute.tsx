'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '@/domain/entities/User';

interface ProtectedRouteProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    allowedRoles?: User['role'][];
    unauthorizedRedirect?: string;
}

/**
 * Componente para proteger rutas que requieren autenticación
 * Redirige a /login si el usuario no está autenticado
 */
export default function ProtectedRoute({
    children,
    fallback,
    allowedRoles,
    unauthorizedRedirect = '/dashboard',
}: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const isAuthorized = !allowedRoles || (user ? allowedRoles.includes(user.role) : false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/');
            return;
        }

        if (!isLoading && isAuthenticated && !isAuthorized) {
            router.push(unauthorizedRedirect);
        }
    }, [isAuthenticated, isLoading, isAuthorized, router, unauthorizedRedirect]);

    if (isLoading) {
        return fallback || (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-300">Verificando sesion...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Se redirige en el useEffect
    }

    if (!isAuthorized) {
        return null;
    }

    return <>{children}</>;
}

/**
 * Componente para rutas que solo deben verse si NO estás autenticado
 * (login, register) - redirige a / si ya hay sesión
 */
export function GuestRoute({ children, fallback }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return fallback || (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (isAuthenticated) {
        return null; // Se redirige en el useEffect
    }

    return <>{children}</>;
}
