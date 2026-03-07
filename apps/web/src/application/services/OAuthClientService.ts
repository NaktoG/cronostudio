import { OAuthClientRepository } from '@/domain/repositories/OAuthClientRepository';
import { OAuthProvider, UpsertOAuthClientSettingInput } from '@/domain/entities/OAuthClientSetting';
import { openOAuthSecret, sealOAuthSecret } from '@/lib/crypto/oauthSecretBox';
import { OAuthConfig, getEnvOAuthConfig } from '@/lib/youtube/oauth';

type OAuthConfigResult = {
  config: OAuthConfig;
  source: 'user' | 'env';
};

export class OAuthClientService {
  constructor(private readonly repository: OAuthClientRepository) {}

  async getEffectiveConfig(userId: string, provider: OAuthProvider): Promise<OAuthConfigResult> {
    const stored = await this.repository.findByUserProvider(userId, provider);
    if (stored) {
      return {
        config: {
          clientId: stored.clientId,
          clientSecret: openOAuthSecret(stored.clientSecretEnc),
          redirectUri: stored.redirectUri,
          scopes: stored.scopes,
        },
        source: 'user',
      };
    }

    return { config: getEnvOAuthConfig(), source: 'env' };
  }

  async getStoredSetting(userId: string, provider: OAuthProvider) {
    return this.repository.findByUserProvider(userId, provider);
  }

  async upsertSetting(input: Omit<UpsertOAuthClientSettingInput, 'clientSecretEnc'> & { clientSecret?: string }) {
    const payload: UpsertOAuthClientSettingInput = {
      ...input,
      clientSecretEnc: input.clientSecret ? sealOAuthSecret(input.clientSecret) : undefined,
    };
    return this.repository.upsert(payload);
  }

  async deleteSetting(userId: string, provider: OAuthProvider) {
    return this.repository.delete(userId, provider);
  }
}
