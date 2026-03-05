import type { User } from '@/domain/entities/User';
import type { CollaborationInvite } from '@/domain/entities/CollaborationInvite';
import type { CollaborationInviteRepository } from '@/domain/repositories/CollaborationInviteRepository';
import type { UserRepository } from '@/domain/repositories/UserRepository';
import { generateToken, hashToken } from '@/lib/token';
import { config } from '@/lib/config';

export class CollaborationService {
  constructor(
    private inviteRepository: CollaborationInviteRepository,
    private userRepository: UserRepository
  ) {}

  async listCollaborators(): Promise<User[]> {
    return this.userRepository.listByRoles(['owner', 'collaborator']);
  }

  async listInvites(invitedBy: string): Promise<CollaborationInvite[]> {
    return this.inviteRepository.listByInviter(invitedBy);
  }

  async createInvite(input: { email: string; invitedBy: string; role?: 'collaborator'; requesterEmail: string }) {
    const email = input.email.toLowerCase().trim();
    if (email === input.requesterEmail.toLowerCase()) {
      throw new CollaborationError('No puedes invitar tu propio correo', 'SELF_INVITE');
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser && existingUser.role === 'collaborator') {
      throw new CollaborationError('El usuario ya es colaborador', 'ALREADY_COLLABORATOR');
    }

    const pending = await this.inviteRepository.findPendingByEmail(email);
    if (pending) {
      throw new CollaborationError('Ya existe una invitacion pendiente', 'INVITE_EXISTS');
    }

    const token = generateToken();
    const tokenHash = hashToken(token);
    const role = input.role ?? 'collaborator';

    await this.inviteRepository.createInvite({ email, role, invitedBy: input.invitedBy, tokenHash });
    const inviteUrl = `${config.app.baseUrl}/invite?token=${token}`;
    return { inviteUrl };
  }

  async acceptInvite(input: { token: string; userId: string; userEmail: string }) {
    const tokenHash = hashToken(input.token);
    const invite = await this.inviteRepository.findPendingByTokenHash(tokenHash);
    if (!invite) {
      throw new CollaborationError('Invitacion invalida o vencida', 'INVITE_INVALID');
    }

    if (invite.email.toLowerCase() !== input.userEmail.toLowerCase()) {
      throw new CollaborationError('Este link no corresponde a tu correo', 'INVITE_EMAIL_MISMATCH');
    }

    await this.userRepository.updateRole(input.userId, invite.role);
    await this.inviteRepository.markAccepted(invite.id);
    return { success: true };
  }
}

export class CollaborationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'CollaborationError';
  }
}
