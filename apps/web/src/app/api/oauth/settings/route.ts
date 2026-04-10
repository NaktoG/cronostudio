import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { requireRoles } from '@/middleware/rbac';
import { buildOAuthClientService } from '@/application/factories/oauthClientServiceFactory';
import { getEnvOAuthConfig, OAuthConfig } from '@/lib/youtube/oauth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const ProviderSchema = z.enum(['youtube']);
const ALLOWED_SCOPES = new Set([
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
]);

const UpdateSchema = z.object({
  clientId: z.string().min(6, 'Client ID requerido'),
  clientSecret: z.string().min(8, 'Client Secret requerido').optional(),
  redirectUri: z.string().url('Redirect URI inválido'),
  scopes: z.union([z.string(), z.array(z.string())]),
});

function normalizeScopes(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return input.map((scope) => scope.trim()).filter(Boolean);
  }
  return input.split(/[,\s]+/).map((scope) => scope.trim()).filter(Boolean);
}

function validateScopes(scopes: string[]) {
  const invalid = scopes.filter((scope) => !ALLOWED_SCOPES.has(scope));
  if (invalid.length > 0) {
    return { ok: false, invalid };
  }
  return { ok: true, invalid: [] as string[] };
}

function resolveProvider(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const providerParam = searchParams.get('provider') ?? 'youtube';
  return ProviderSchema.parse(providerParam);
}

function validateRedirectUri(value: string, request: NextRequest) {
  try {
    const parsed = new URL(value);
    const origin = request.nextUrl.origin;
    if (parsed.origin !== origin) {
      return { ok: false, message: 'Redirect URI debe usar el mismo origen que la app.' };
    }
    if (!parsed.pathname.endsWith('/api/google/oauth/callback')) {
      return { ok: false, message: 'Redirect URI debe terminar en /api/google/oauth/callback.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: 'Redirect URI invalido.' };
  }
}

function getSafeEnvConfig(): OAuthConfig | null {
  try {
    return getEnvOAuthConfig();
  } catch {
    return null;
  }
}

const handler = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = (await getAuthUser(request))?.userId ?? null;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const provider = resolveProvider(request);
    const service = buildOAuthClientService();

    if (request.method === 'GET') {
      const stored = await service.getStoredSetting(userId, provider);
      const envConfig = getSafeEnvConfig();
      return withSecurityHeaders(NextResponse.json({
        provider,
        configured: Boolean(stored),
        source: stored ? 'user' : 'env',
        clientId: stored?.clientId ?? envConfig?.clientId ?? '',
        redirectUri: stored?.redirectUri ?? envConfig?.redirectUri ?? '',
        scopes: stored?.scopes ?? envConfig?.scopes ?? [],
        hasSecret: Boolean(stored?.clientSecretEnc),
      }));
    }

    if (request.method === 'PUT') {
      const body = await request.json();
      const data = UpdateSchema.parse(body);
      const scopes = normalizeScopes(data.scopes);
      if (scopes.length === 0) {
        return withSecurityHeaders(NextResponse.json({ error: 'Scopes requeridos' }, { status: 400 }));
      }
      const redirectCheck = validateRedirectUri(data.redirectUri, request);
      if (!redirectCheck.ok) {
        return withSecurityHeaders(NextResponse.json({ error: redirectCheck.message }, { status: 400 }));
      }
      const scopesCheck = validateScopes(scopes);
      if (!scopesCheck.ok) {
        return withSecurityHeaders(NextResponse.json({
          error: 'Scopes no permitidos',
          details: scopesCheck.invalid,
        }, { status: 400 }));
      }

      const existing = await service.getStoredSetting(userId, provider);
      if (!data.clientSecret && !existing?.clientSecretEnc) {
        return withSecurityHeaders(NextResponse.json({ error: 'Client Secret requerido' }, { status: 400 }));
      }

      const updated = await service.upsertSetting({
        userId,
        provider,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        redirectUri: data.redirectUri,
        scopes,
      });

      return withSecurityHeaders(NextResponse.json({
        provider,
        configured: true,
        clientId: updated.clientId,
        redirectUri: updated.redirectUri,
        scopes: updated.scopes,
        hasSecret: Boolean(updated.clientSecretEnc),
      }));
    }

    if (request.method === 'DELETE') {
      const deleted = await service.deleteSetting(userId, provider);
      return withSecurityHeaders(NextResponse.json({ deleted }));
    }

    return withSecurityHeaders(NextResponse.json({ error: 'Method not allowed' }, { status: 405 }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos', details: error.flatten() }, { status: 400 }));
    }
    logger.error('oauth.settings.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al guardar configuracion' }, { status: 500 }));
  }
});

export const GET = requireRoles(['owner'])(handler);
export const PUT = requireRoles(['owner'])(handler);
export const DELETE = requireRoles(['owner'])(handler);
