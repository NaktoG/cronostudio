// app/api/auth/register/route.ts
// Refactored to use AuthService from Clean Architecture

import { NextRequest, NextResponse } from 'next/server';
import { validateInput, RegisterSchema } from '@/lib/validation';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, LOGIN_RATE_LIMIT, enforceRateLimit } from '@/middleware/rateLimit';
import { logger } from '@/lib/logger';
import { generateToken, hashToken } from '@/lib/token';
import { sendEmail } from '@/lib/email';
import { query } from '@/lib/db';
import { config } from '@/lib/config';

// Clean Architecture services
import { AuthService, AuthError } from '@/application/services/AuthService';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { PostgresSessionRepository } from '@/infrastructure/repositories/PostgresSessionRepository';

// Dependency injection
const userRepository = new PostgresUserRepository();
const sessionRepository = new PostgresSessionRepository();
const authService = new AuthService(userRepository, sessionRepository);
const DUPLICATE_EMAIL_MESSAGE = 'Si el email es válido, recibirás un correo para verificar tu cuenta.';

function isDuplicateEmailViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const maybePgError = error as { code?: string; constraint?: string; detail?: string; message?: string };
    if (maybePgError.code !== '23505') return false;

    const context = [maybePgError.constraint, maybePgError.detail, maybePgError.message]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return context.includes('email');
}

/**
 * POST /api/auth/register
 * Register a new user
 */
export const POST = rateLimit(LOGIN_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const body = await request.json();
        const validatedData = validateInput(RegisterSchema, body);
        const normalizedEmail = validatedData.email.trim().toLowerCase();

        const emailLimit = await enforceRateLimit(
            `${request.nextUrl.pathname}:email:${normalizedEmail}`,
            LOGIN_RATE_LIMIT,
            request.nextUrl.pathname
        );
        if (emailLimit) {
            return emailLimit;
        }

        const allowPublicSignup = process.env.ALLOW_PUBLIC_SIGNUP !== 'false';
        if (config.isProduction && !allowPublicSignup) {
            return withSecurityHeaders(NextResponse.json({ error: 'Registro deshabilitado' }, { status: 403 }));
        }

        // Use AuthService for registration
        const user = await authService.registerWithoutSession({
            email: validatedData.email,
            password: validatedData.password,
            name: validatedData.name,
        });

        logger.info('User registered', { userId: user.id });

        const rawToken = generateToken();
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await query(
            `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
             VALUES ($1, $2, $3)`,
            [user.id, tokenHash, expiresAt]
        );

        const baseUrl = config.app.baseUrl;
        const verifyUrl = `${baseUrl}/verify-email?token=${rawToken}`;
        const enviado = await sendEmail({
            to: user.email,
            subject: 'Verifica tu email - CronoStudio',
            html: `
              <p>Gracias por registrarte.</p>
              <p>Confirma tu email aqui:</p>
              <p><a href="${verifyUrl}">${verifyUrl}</a></p>
            `,
        });

        const payload: Record<string, unknown> = {
            message: 'Usuario registrado exitosamente',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
            },
        };

        if (!enviado && config.auth.allowDebugLinks) {
            payload['enlaceVerificacion'] = verifyUrl;
        }

        return withSecurityHeaders(NextResponse.json(payload, { status: 201 }));
    } catch (error) {
        // Handle AuthError
        if (error instanceof AuthError) {
            if (error.code === 'EMAIL_EXISTS') {
                return withSecurityHeaders(NextResponse.json({ message: DUPLICATE_EMAIL_MESSAGE }, { status: 201 }));
            }
        }

        if (isDuplicateEmailViolation(error)) {
            logger.warn('Register duplicate email race handled', { error: String(error) });
            return withSecurityHeaders(NextResponse.json({ message: DUPLICATE_EMAIL_MESSAGE }, { status: 201 }));
        }

        // Handle validation errors
        if (error instanceof Error && error.message.includes('Validation error')) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos' }, { status: 400 }));
        }

        logger.error('Registration error', { error: String(error) });
        return withSecurityHeaders(NextResponse.json({ error: 'Error al registrar usuario' }, { status: 500 }));
    }
});
