import { query } from '@/lib/db';
import { SessionRepository, SessionRecord } from '@/domain/repositories/SessionRepository';

export class PostgresSessionRepository implements SessionRepository {
  async create(userId: string, refreshTokenHash: string, expiresAt: Date): Promise<SessionRecord> {
    const result = await query(
      `INSERT INTO auth_sessions (user_id, refresh_token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, refresh_token_hash, expires_at, created_at, revoked_at`,
      [userId, refreshTokenHash, expiresAt]
    );

    return this.toDomain(result.rows[0]);
  }

  async findValidByTokenHash(refreshTokenHash: string): Promise<SessionRecord | null> {
    const result = await query(
      `SELECT id, user_id, refresh_token_hash, expires_at, created_at, revoked_at
       FROM auth_sessions
       WHERE refresh_token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
      [refreshTokenHash]
    );

    if (result.rows.length === 0) return null;
    return this.toDomain(result.rows[0]);
  }

  async revokeById(sessionId: string): Promise<void> {
    await query(
      'UPDATE auth_sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL',
      [sessionId]
    );
  }

  async revokeByTokenHash(refreshTokenHash: string): Promise<void> {
    await query(
      'UPDATE auth_sessions SET revoked_at = NOW() WHERE refresh_token_hash = $1 AND revoked_at IS NULL',
      [refreshTokenHash]
    );
  }

  async deleteByUserId(userId: string): Promise<void> {
    await query('DELETE FROM auth_sessions WHERE user_id = $1', [userId]);
  }

  private toDomain(row: Record<string, unknown>): SessionRecord {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      refreshTokenHash: row.refresh_token_hash as string,
      expiresAt: new Date(row.expires_at as string),
      createdAt: new Date(row.created_at as string),
      revokedAt: row.revoked_at ? new Date(row.revoked_at as string) : null,
    };
  }
}
