import { query } from '@/lib/db';
import type { CollaborationInvite } from '@/domain/entities/CollaborationInvite';
import type { CollaborationInviteRepository } from '@/domain/repositories/CollaborationInviteRepository';

export class PostgresCollaborationInviteRepository implements CollaborationInviteRepository {
  async listByInviter(invitedBy: string): Promise<CollaborationInvite[]> {
    const result = await query(
      `SELECT id, email, role, invited_by, status, created_at, expires_at, accepted_at
       FROM collaboration_invites
       WHERE invited_by = $1
       ORDER BY created_at DESC`,
      [invitedBy]
    );
    return result.rows.map((row) => this.toDomain(row));
  }

  async findPendingByEmail(email: string): Promise<CollaborationInvite | null> {
    const result = await query(
      `SELECT id, email, role, invited_by, status, created_at, expires_at, accepted_at
       FROM collaboration_invites
       WHERE email = $1 AND status = 'pending' AND expires_at > NOW()
       LIMIT 1`,
      [email]
    );
    if (result.rows.length === 0) return null;
    return this.toDomain(result.rows[0]);
  }

  async findPendingByTokenHash(tokenHash: string): Promise<CollaborationInvite | null> {
    const result = await query(
      `SELECT id, email, role, invited_by, status, created_at, expires_at, accepted_at
       FROM collaboration_invites
       WHERE token_hash = $1 AND status = 'pending' AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );
    if (result.rows.length === 0) return null;
    return this.toDomain(result.rows[0]);
  }

  async createInvite(input: { email: string; role: 'collaborator'; invitedBy: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    await query(
      `INSERT INTO collaboration_invites (email, role, invited_by, token_hash, status, expires_at)
       VALUES ($1, $2, $3, $4, 'pending', $5)`,
      [input.email, input.role, input.invitedBy, input.tokenHash, input.expiresAt]
    );
  }

  async markAccepted(inviteId: string): Promise<void> {
    await query(
      `UPDATE collaboration_invites
       SET status = 'accepted', accepted_at = NOW()
       WHERE id = $1`,
      [inviteId]
    );
  }

  private toDomain(row: Record<string, unknown>): CollaborationInvite {
    return {
      id: row.id as string,
      email: row.email as string,
      role: row.role as 'collaborator',
      invitedBy: row.invited_by as string,
      status: row.status as 'pending' | 'accepted' | 'revoked',
      createdAt: new Date(row.created_at as string),
      expiresAt: new Date(row.expires_at as string),
      acceptedAt: row.accepted_at ? new Date(row.accepted_at as string) : null,
    };
  }
}
