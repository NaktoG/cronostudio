import { NextRequest, NextResponse } from 'next/server';
import { validateInput, VerifyEmailSchema } from '@/lib/validation';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, LOGIN_RATE_LIMIT } from '@/middleware/rateLimit';
import { query } from '@/lib/db';
import { hashToken } from '@/lib/token';
import { logger } from '@/lib/logger';

export const POST = rateLimit(LOGIN_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const data = validateInput(VerifyEmailSchema, body);

    const tokenHash = hashToken(data.token);
    const tokenResult = await query(
      `SELECT id, user_id, expires_at, used_at
       FROM email_verification_tokens
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

    await query('UPDATE app_users SET email_verified_at = NOW(), updated_at = NOW() WHERE id = $1', [tokenRow.user_id]);
    await query('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1', [tokenRow.id]);

    return withSecurityHeaders(NextResponse.json({ message: 'Email verificado' }));
  } catch (error) {
    logger.error('auth.email_verify.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al verificar email' }, { status: 500 }));
  }
});
