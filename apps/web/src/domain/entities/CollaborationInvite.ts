export type CollaborationInviteStatus = 'pending' | 'accepted' | 'revoked';

export type CollaborationInvite = {
  id: string;
  email: string;
  role: 'collaborator';
  invitedBy: string;
  status: CollaborationInviteStatus;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date | null;
};
