import { query } from '@/lib/db';
import { OAuthClientRepository } from '@/domain/repositories/OAuthClientRepository';
import { OAuthClientSetting, OAuthProvider, UpsertOAuthClientSettingInput } from '@/domain/entities/OAuthClientSetting';

function mapRow(row: Record<string, unknown>): OAuthClientSetting {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    provider: row.provider as OAuthProvider,
    clientId: row.client_id as string,
    clientSecretEnc: row.client_secret_enc as string,
    redirectUri: row.redirect_uri as string,
    scopes: (row.scopes as string[]) ?? [],
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

export class PostgresOAuthClientRepository implements OAuthClientRepository {
  async findByUserProvider(userId: string, provider: OAuthProvider): Promise<OAuthClientSetting | null> {
    const result = await query(
      `SELECT id, user_id, provider, client_id, client_secret_enc, redirect_uri, scopes, created_at, updated_at
       FROM oauth_client_settings
       WHERE user_id = $1 AND provider = $2
       LIMIT 1`,
      [userId, provider]
    );

    if (result.rows.length === 0) return null;
    return mapRow(result.rows[0] as Record<string, unknown>);
  }

  async upsert(input: UpsertOAuthClientSettingInput): Promise<OAuthClientSetting> {
    const result = await query(
      `INSERT INTO oauth_client_settings (
          user_id,
          provider,
          client_id,
          client_secret_enc,
          redirect_uri,
          scopes
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, provider)
        DO UPDATE SET
          client_id = EXCLUDED.client_id,
          client_secret_enc = COALESCE(EXCLUDED.client_secret_enc, oauth_client_settings.client_secret_enc),
          redirect_uri = EXCLUDED.redirect_uri,
          scopes = EXCLUDED.scopes,
          updated_at = NOW()
        RETURNING id, user_id, provider, client_id, client_secret_enc, redirect_uri, scopes, created_at, updated_at`,
      [
        input.userId,
        input.provider,
        input.clientId,
        input.clientSecretEnc ?? null,
        input.redirectUri,
        input.scopes,
      ]
    );

    return mapRow(result.rows[0] as Record<string, unknown>);
  }

  async delete(userId: string, provider: OAuthProvider): Promise<boolean> {
    const result = await query(
      `DELETE FROM oauth_client_settings
       WHERE user_id = $1 AND provider = $2
       RETURNING id`,
      [userId, provider]
    );

    return result.rows.length > 0;
  }
}
