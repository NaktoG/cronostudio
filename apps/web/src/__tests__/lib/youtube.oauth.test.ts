import { describe, expect, it, vi, afterEach } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe('youtube oauth helpers', () => {
  it('builds auth URL with scopes, state, and PKCE challenge', async () => {
    process.env.YOUTUBE_OAUTH_CLIENT_ID = 'client-id';
    process.env.YOUTUBE_OAUTH_CLIENT_SECRET = 'client-secret';
    process.env.YOUTUBE_OAUTH_REDIRECT_URI = 'http://localhost:3000/api/integrations/youtube/callback';
    process.env.YOUTUBE_OAUTH_SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

    const { buildAuthUrl, generateCodeChallenge } = await import('@/lib/youtube/oauth');

    const state = 'state-value';
    const codeVerifier = 'verifier-value';
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const url = buildAuthUrl(state, codeChallenge);
    const parsed = new URL(url);

    expect(parsed.searchParams.get('scope')).toContain('https://www.googleapis.com/auth/youtube.readonly');
    expect(parsed.searchParams.get('state')).toBe(state);
    expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
    expect(parsed.searchParams.get('code_challenge')).toBe(codeChallenge);
    expect(codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
