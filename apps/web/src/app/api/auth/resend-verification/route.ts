import { NextRequest, NextResponse } from 'next/server';
import { validateInput, ResendVerificationSchema } from '@/lib/validation';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, LOGIN_RATE_LIMIT } from '@/middleware/rateLimit';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { query } from '@/lib/db';
import { generateToken, hashToken } from '@/lib/token';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

const userRepository = new PostgresUserRepository();

export const POST = rateLimit(LOGIN_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const data = validateInput(ResendVerificationSchema, body);

    const user = await userRepository.findByEmail(data.email);
    if (!user || user.emailVerifiedAt) {
      return withSecurityHeaders(NextResponse.json({ message: 'Si el email existe, se enviara un link' }));
    }

    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/verify-email?token=${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Verifica tu email - CronoStudio',
      html: `
        <p>Confirma tu email para activar la cuenta.</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      `,
    });

    return withSecurityHeaders(NextResponse.json({ message: 'Si el email existe, se enviara un link' }));
  } catch (error) {
    logger.error('auth.email_resend.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al reenviar verificacion' }, { status: 500 }));
  }
});
