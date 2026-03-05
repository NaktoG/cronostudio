import { CollaborationService } from '@/application/services/CollaborationService';
import { PostgresCollaborationInviteRepository } from '@/infrastructure/repositories/PostgresCollaborationInviteRepository';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';

export function buildCollaborationService(): CollaborationService {
  return new CollaborationService(
    new PostgresCollaborationInviteRepository(),
    new PostgresUserRepository()
  );
}
