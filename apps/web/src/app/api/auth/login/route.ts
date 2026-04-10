// app/api/auth/login/route.ts
// Refactored to use AuthService from Clean Architecture

import { NextRequest, NextResponse } from 'next/server';
import { validateInput, LoginSchema } from '@/lib/validation';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, LOGIN_RATE_LIMIT, enforceRateLimit } from '@/middleware/rateLimit';
import { logger } from '@/lib/logger';
import { setAccessCookie, setRefreshCookie } from '@/lib/authCookies';

// Clean Architecture services
import { AuthService, AuthError } from '@/application/services/AuthService';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { PostgresSessionRepository } from '@/infrastructure/repositories/PostgresSessionRepository';

// Dependency injection
const userRepository = new PostgresUserRepository();
const sessionRepository = new PostgresSessionRepository();
const authService = new AuthService(userRepository, sessionRepository);

/**
 * POST /api/auth/login
 * Authenticate an existing user
 */
export const POST = rateLimit(LOGIN_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const body = await request.json();
        const validatedData = validateInput(LoginSchema, body);
        const normalizedEmail = validatedData.email.trim().toLowerCase();
        const emailLimit = await enforceRateLimit(
            `${request.nextUrl.pathname}:email:${normalizedEmail}`,
            LOGIN_RATE_LIMIT,
            request.nextUrl.pathname
        );
        if (emailLimit) {
            return emailLimit;
        }

        // Use AuthService for login
        const result = await authService.login(validatedData.email, validatedData.password);

        logger.info('User logged in', { userId: result.user.id });

        const response = NextResponse.json({
            message: 'Login exitoso',
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                role: result.user.role,
            },
        });

        setAccessCookie(response, result.token);
        setRefreshCookie(response, result.refreshToken);

        return withSecurityHeaders(response);
    } catch (error) {
        // Handle AuthError
        if (error instanceof AuthError) {
            return withSecurityHeaders(NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 }));
        }

        // Handle validation errors
        if (error instanceof Error && error.message.includes('Validation error')) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos' }, { status: 400 }));
        }

        logger.error('Login error', { error: String(error) });
        return withSecurityHeaders(NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 }));
    }
});
