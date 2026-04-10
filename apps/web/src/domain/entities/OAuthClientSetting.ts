export type OAuthProvider = 'youtube';

export type OAuthClientSetting = {
  id: string;
  userId: string;
  provider: OAuthProvider;
  clientId: string;
  clientSecretEnc: string;
  redirectUri: string;
  scopes: string[];
  createdAt: string;
  updatedAt: string;
};

export type UpsertOAuthClientSettingInput = {
  userId: string;
  provider: OAuthProvider;
  clientId: string;
  clientSecretEnc?: string;
  redirectUri: string;
  scopes: string[];
};
