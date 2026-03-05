import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function redactChannelId(value: string | null): string | null {
  if (!value) return null;
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function getEnvConfigured() {
  return {
    clientId: Boolean(process.env.YOUTUBE_OAUTH_CLIENT_ID),
    clientSecret: Boolean(process.env.YOUTUBE_OAUTH_CLIENT_SECRET),
    redirectUri: Boolean(process.env.YOUTUBE_OAUTH_REDIRECT_URI),
    encryptionKey: Boolean(process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY),
    scopes: Boolean(process.env.YOUTUBE_OAUTH_SCOPES),
  };
}

export const GET = withAuth(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return withSecurityHeaders(NextResponse.json({ error: 'Not found' }, { status: 404 }));
    }

    const userId = (await getAuthUser(request))?.userId ?? null;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const envConfigured = getEnvConfigured();
    const redirectUri = process.env.YOUTUBE_OAUTH_REDIRECT_URI || null;

    let dbReady = true;
    let tableExists = false;
    let rowCount = 0;
    let sampleRow: Record<string, unknown> | null = null;

    try {
      const tableResult = await query(
        `SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'youtube_integrations'
        ) as exists`
      );
      tableExists = Boolean(tableResult.rows[0]?.exists);
    } catch {
      dbReady = false;
    }

    if (dbReady && tableExists) {
      const countResult = await query('SELECT COUNT(*)::int as count FROM youtube_integrations');
      rowCount = countResult.rows[0]?.count ?? 0;

      if (rowCount > 0) {
        const rowResult = await query(
          `SELECT youtube_channel_id, youtube_channel_title, scope, token_expiry_at, access_token_enc, refresh_token_enc
           FROM youtube_integrations
           ORDER BY updated_at DESC
           LIMIT 1`
        );
        const row = rowResult.rows[0];
        sampleRow = {
          youtube_channel_id: redactChannelId(row.youtube_channel_id ?? null),
          youtube_channel_title: row.youtube_channel_title ?? null,
          scope: row.scope ?? null,
          token_expiry_at: row.token_expiry_at ? new Date(row.token_expiry_at).toISOString() : null,
          access_token_enc_len: row.access_token_enc ? String(row.access_token_enc).length : 0,
          refresh_token_enc_len: row.refresh_token_enc ? String(row.refresh_token_enc).length : null,
        };
      }
    }

    const requiredEnvOk = [
      envConfigured.clientId,
      envConfigured.clientSecret,
      envConfigured.redirectUri,
      envConfigured.encryptionKey,
    ].every(Boolean);

    const nextSteps: string[] = [];
    if (!requiredEnvOk) {
      nextSteps.push('Set envs en apps/web/.env.local');
    } else if (rowCount === 0) {
      nextSteps.push('Abrir /api/integrations/youtube/connect y completar consentimiento');
    } else {
      nextSteps.push('Probar /api/integrations/youtube/disconnect y verificar /status');
    }

    return withSecurityHeaders(NextResponse.json({
      envConfigured,
      redirectUri,
      dbReady,
      tableExists,
      integrationRows: {
        rowCount,
        sampleRow,
      },
      nextSteps,
    }));
  } catch (error) {
    logger.error('[youtube.diagnostics] Error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error en diagnostics' }, { status: 500 }));
  }
}));
