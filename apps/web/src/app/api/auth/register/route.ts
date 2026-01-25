// app/api/auth/register/route.ts
// Refactored to use AuthService from Clean Architecture

import { NextRequest, NextResponse } from 'next/server';
import { validateInput, RegisterSchema } from '@/lib/validation';
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
 * POST /api/auth/register
 * Register a new user
 */
export const POST = rateLimit(LOGIN_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const body = await request.json();
        const validatedData = validateInput(RegisterSchema, body);

        // Use AuthService for registration
        const result = await authService.register({
            email: validatedData.email,
            password: validatedData.password,
            name: validatedData.name,
        });

        logger.info('User registered', { userId: result.user.id, email: result.user.email });

        const response = NextResponse.json({
            message: 'Usuario registrado exitosamente',
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                createdAt: result.user.createdAt,
            },
            token: result.token,
        }, { status: 201 });

        return withSecurityHeaders(response);
    } catch (error) {
        // Handle AuthError
        if (error instanceof AuthError) {
            if (error.code === 'EMAIL_EXISTS') {
                return NextResponse.json({ error: 'Email ya registrado' }, { status: 409 });
            }
        }

        // Handle validation errors
        if (error instanceof Error && error.message.includes('Validation error')) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        logger.error('Registration error', { error: String(error) });
        return NextResponse.json({ error: 'Error al registrar usuario' }, { status: 500 });
    }
});
