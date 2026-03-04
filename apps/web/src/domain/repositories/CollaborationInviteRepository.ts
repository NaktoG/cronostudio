import type { CollaborationInvite } from '@/domain/entities/CollaborationInvite';

export interface CollaborationInviteRepository {
  listByInviter(invitedBy: string): Promise<CollaborationInvite[]>;
  findPendingByEmail(email: string): Promise<CollaborationInvite | null>;
  findPendingByTokenHash(tokenHash: string): Promise<CollaborationInvite | null>;
  createInvite(input: { email: string; role: 'collaborator'; invitedBy: string; tokenHash: string }): Promise<void>;
  markAccepted(inviteId: string): Promise<void>;
}
