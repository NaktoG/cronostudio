export interface SessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}

export interface SessionRepository {
  create(userId: string, refreshTokenHash: string, expiresAt: Date): Promise<SessionRecord>;
  findValidByTokenHash(refreshTokenHash: string): Promise<SessionRecord | null>;
  revokeById(sessionId: string): Promise<void>;
  revokeByTokenHash(refreshTokenHash: string): Promise<void>;
}
