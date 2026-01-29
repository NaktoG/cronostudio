import { NextRequest, NextResponse } from 'next/server';
import { validateInput, PasswordResetSchema } from '@/lib/validation';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, LOGIN_RATE_LIMIT } from '@/middleware/rateLimit';
import { query } from '@/lib/db';
import { hashToken } from '@/lib/token';
import bcrypt from 'bcrypt';
import { logger } from '@/lib/logger';

export const POST = rateLimit(LOGIN_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const data = validateInput(PasswordResetSchema, body);

    const tokenHash = hashToken(data.token);
    const tokenResult = await query(
      `SELECT id, user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token_hash = $1
       LIMIT 1`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return withSecurityHeaders(NextResponse.json({ error: 'Token inválido' }, { status: 400 }));
    }

    const tokenRow = tokenResult.rows[0];
    if (tokenRow.used_at || new Date(tokenRow.expires_at).getTime() < Date.now()) {
      return withSecurityHeaders(NextResponse.json({ error: 'Token expirado' }, { status: 400 }));
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    await query('UPDATE app_users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, tokenRow.user_id]);
    await query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [tokenRow.id]);
    await query('UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [tokenRow.user_id]);

    return withSecurityHeaders(NextResponse.json({ message: 'Contraseña actualizada' }));
  } catch (error) {
    logger.error('auth.password_reset.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al restablecer contraseña' }, { status: 500 }));
  }
});
