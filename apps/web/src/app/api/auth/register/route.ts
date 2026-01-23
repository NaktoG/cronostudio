import { NextRequest, NextResponse } from 'next/server';
import { validateInput, RegisterSchema, RegisterInput } from '@/lib/validation';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, LOGIN_RATE_LIMIT } from '@/middleware/rateLimit';
import { query } from '@/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 12;

/**
 * POST /api/auth/register
 * Registra un nuevo usuario
 */
export const POST = rateLimit(LOGIN_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const body = await request.json();

        // Validar input
        const validatedData = validateInput(RegisterSchema, body);

        // Verificar si el email ya existe
        const existingUser = await query(
            'SELECT id FROM app_users WHERE email = $1',
            [validatedData.email]
        );

        if (existingUser.rows.length > 0) {
            return NextResponse.json(
                { error: 'Email ya registrado' },
                { status: 409 }
            );
        }

        // Hash del password
        const passwordHash = await bcrypt.hash(validatedData.password, SALT_ROUNDS);

        // Insertar usuario
        const result = await query(
            `INSERT INTO app_users (email, password_hash, name) 
             VALUES ($1, $2, $3) 
             RETURNING id, email, name, created_at`,
            [validatedData.email, passwordHash, validatedData.name]
        );

        const user = result.rows[0];

        // Generar JWT
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        console.log('[POST /api/auth/register] Usuario registrado:', {
            id: user.id,
            email: user.email,
        });

        const response = NextResponse.json(
            {
                message: 'Usuario registrado exitosamente',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    createdAt: user.created_at,
                },
                token,
            },
            { status: 201 }
        );

        return withSecurityHeaders(response);
    } catch (error) {
        if (error instanceof Error && error.message.includes('Validation error')) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        console.error('[POST /api/auth/register] Error:', error instanceof Error ? error.message : 'Unknown error');

        return NextResponse.json(
            { error: 'Error al registrar usuario' },
            { status: 500 }
        );
    }
});
