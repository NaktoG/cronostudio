import { OAuthClientService } from '@/application/services/OAuthClientService';
import { PostgresOAuthClientRepository } from '@/infrastructure/repositories/PostgresOAuthClientRepository';

export function buildOAuthClientService(): OAuthClientService {
  return new OAuthClientService(new PostgresOAuthClientRepository());
}
