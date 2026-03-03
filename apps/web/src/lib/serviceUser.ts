import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { hasValidServiceSecret } from '@/middleware/webhook';

export async function resolveServiceUserId(): Promise<string | null> {
  const serviceUserId = process.env.CRONOSTUDIO_SERVICE_USER_ID?.trim();
  if (serviceUserId) {
    const result = await query('SELECT id FROM app_users WHERE id = $1', [serviceUserId]);
    if (result.rows.length > 0) return serviceUserId;
    return null;
  }

  const serviceUserEmail = process.env.CRONOSTUDIO_SERVICE_USER_EMAIL?.trim();
  if (serviceUserEmail) {
    const result = await query('SELECT id FROM app_users WHERE email = $1', [serviceUserEmail]);
    if (result.rows.length > 0) return result.rows[0].id as string;
    return null;
  }

  return null;
}

export async function getServiceUserId(request: NextRequest): Promise<string | null> {
  if (!hasValidServiceSecret(request)) return null;
  return resolveServiceUserId();
}
