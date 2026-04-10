import { OAuthClientSetting, OAuthProvider, UpsertOAuthClientSettingInput } from '@/domain/entities/OAuthClientSetting';

export interface OAuthClientRepository {
  findByUserProvider(userId: string, provider: OAuthProvider): Promise<OAuthClientSetting | null>;
  upsert(input: UpsertOAuthClientSettingInput): Promise<OAuthClientSetting>;
  delete(userId: string, provider: OAuthProvider): Promise<boolean>;
}
