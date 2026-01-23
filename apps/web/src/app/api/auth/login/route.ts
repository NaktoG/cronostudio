import { NextRequest, NextResponse } from 'next/server';
import { validateInput, LoginSchema } from '@/lib/validation';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, LOGIN_RATE_LIMIT } from '@/middleware/rateLimit';
import { query } from '@/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * POST /api/auth/login
 * Autentica un usuario existente
 */
export const POST = rateLimit(LOGIN_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const body = await request.json();

        // Validar input
        const validatedData = validateInput(LoginSchema, body);

        // Buscar usuario por email
        const result = await query(
            'SELECT id, email, password_hash, name FROM app_users WHERE email = $1',
            [validatedData.email]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        const user = result.rows[0];

        // Verificar password
        const isValidPassword = await bcrypt.compare(
            validatedData.password,
            user.password_hash
        );

        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        // Generar JWT
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        console.log('[POST /api/auth/login] Usuario autenticado:', {
            id: user.id,
            email: user.email,
        });

        const response = NextResponse.json(
            {
                message: 'Login exitoso',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                token,
            },
            { status: 200 }
        );

        return withSecurityHeaders(response);
    } catch (error) {
        if (error instanceof Error && error.message.includes('Validation error')) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        console.error('[POST /api/auth/login] Error:', error instanceof Error ? error.message : 'Unknown error');

        return NextResponse.json(
            { error: 'Error al iniciar sesión' },
            { status: 500 }
        );
    }
});
