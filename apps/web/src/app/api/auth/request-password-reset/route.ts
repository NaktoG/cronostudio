import { NextRequest, NextResponse } from 'next/server';
import { validateInput, PasswordResetRequestSchema } from '@/lib/validation';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, LOGIN_RATE_LIMIT } from '@/middleware/rateLimit';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { query } from '@/lib/db';
import { generateToken, hashToken } from '@/lib/token';
import { config } from '@/lib/config';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

const userRepository = new PostgresUserRepository();

export const POST = rateLimit(LOGIN_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const data = validateInput(PasswordResetRequestSchema, body);

    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      return withSecurityHeaders(NextResponse.json({ message: 'Si el email existe, se enviara un link' }));
    }

    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    const baseUrl = config.app.baseUrl;
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    const enviado = await sendEmail({
      to: user.email,
      subject: 'Restablecer contraseña - CronoStudio',
      html: `
        <p>Solicitaste restablecer tu contraseña.</p>
        <p>Usa este link para continuar:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Si no fuiste vos, ignora este email.</p>
      `,
    });

    const payload: Record<string, unknown> = { message: 'Si el email existe, se enviará un link' };
    if (!enviado) {
      payload['enlaceManual'] = resetUrl;
    }

    return withSecurityHeaders(NextResponse.json(payload));
  } catch (error) {
    logger.error('auth.password_reset.request.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al solicitar reset' }, { status: 500 }));
  }
});
