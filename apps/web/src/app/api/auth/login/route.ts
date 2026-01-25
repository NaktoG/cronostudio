// app/api/auth/login/route.ts
// Refactored to use AuthService from Clean Architecture

import { NextRequest, NextResponse } from 'next/server';
import { validateInput, LoginSchema } from '@/lib/validation';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, LOGIN_RATE_LIMIT } from '@/middleware/rateLimit';
import { logger } from '@/lib/logger';

// Clean Architecture services
import { AuthService, AuthError } from '@/application/services/AuthService';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';

// Dependency injection
const userRepository = new PostgresUserRepository();
const authService = new AuthService(userRepository);

/**
 * POST /api/auth/login
 * Authenticate an existing user
 */
export const POST = rateLimit(LOGIN_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const body = await request.json();
        const validatedData = validateInput(LoginSchema, body);

        // Use AuthService for login
        const result = await authService.login(validatedData.email, validatedData.password);

        logger.info('User logged in', { userId: result.user.id, email: result.user.email });

        const response = NextResponse.json({
            message: 'Login exitoso',
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
            },
            token: result.token,
        });

        return withSecurityHeaders(response);
    } catch (error) {
        // Handle AuthError
        if (error instanceof AuthError) {
            if (error.code === 'INVALID_CREDENTIALS') {
                return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
            }
        }

        // Handle validation errors
        if (error instanceof Error && error.message.includes('Validation error')) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        logger.error('Login error', { error: String(error) });
        return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 });
    }
});
