import crypto from 'crypto';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export type OAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it in apps/web/.env.local.`);
  }
  return value;
}

function getRequiredEnvFrom(primary: string, fallback: string): string {
  const value = process.env[primary] || process.env[fallback];
  if (!value) {
    throw new Error(`Missing ${primary} (or ${fallback}). Set it in apps/web/.env.local.`);
  }
  return value;
}

export function getEnvOAuthConfig(): OAuthConfig {
  const clientId = getRequiredEnvFrom('GOOGLE_CLIENT_ID', 'YOUTUBE_OAUTH_CLIENT_ID');
  const clientSecret = getRequiredEnvFrom('GOOGLE_CLIENT_SECRET', 'YOUTUBE_OAUTH_CLIENT_SECRET');
  const redirectUri = getRequiredEnvFrom('GOOGLE_REDIRECT_URI', 'YOUTUBE_OAUTH_REDIRECT_URI');
  const scopesRaw = process.env.YOUTUBE_OAUTH_SCOPES
    || 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly';
  const scopes = scopesRaw.split(/[\s,]+/).filter(Boolean);
  return { clientId, clientSecret, redirectUri, scopes };
}

export function generateState(): string {
  return crypto.randomBytes(16).toString('base64url');
}

export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

type AuthUrlOptions = {
  prompt?: string;
  authuser?: string;
  loginHint?: string;
  redirectUri?: string;
  config?: OAuthConfig;
};

export function buildAuthUrl(state: string, codeChallenge: string, options?: AuthUrlOptions): string {
  const config = options?.config ?? getEnvOAuthConfig();
  const redirectUri = options?.redirectUri ?? config.redirectUri;
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    access_type: 'offline',
    prompt: options?.prompt ?? 'select_account consent',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  if (options?.authuser) params.set('authuser', options.authuser);
  if (options?.loginHint) params.set('login_hint', options.loginHint);
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri?: string,
  configOverride?: OAuthConfig
) {
  const config = configOverride ?? getEnvOAuthConfig();
  const effectiveRedirectUri = redirectUri ?? config.redirectUri;
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: effectiveRedirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error('OAuth token exchange failed.');
    (error as { status?: number }).status = response.status;
    (error as { oauth?: { error?: string; error_description?: string } }).oauth = {
      error: data?.error,
      error_description: data?.error_description,
    };
    throw error;
  }
  return data as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };
}
