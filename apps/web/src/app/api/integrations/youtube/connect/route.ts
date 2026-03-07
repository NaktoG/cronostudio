import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { buildAuthUrl, generateCodeChallenge, generateCodeVerifier, generateState } from '@/lib/youtube/oauth';
import { buildOAuthClientService } from '@/application/factories/oauthClientServiceFactory';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'yt_oauth_state';
const VERIFIER_COOKIE = 'yt_oauth_verifier';
const USER_COOKIE = 'yt_oauth_user';
const REDIRECT_COOKIE = 'yt_oauth_redirect';
const COOKIE_MAX_AGE = 10 * 60; // 10 minutes

function resolveRedirectUri(request: NextRequest, fallback: string): string {
  const { searchParams } = new URL(request.url);
  const incoming = searchParams.get('redirect_uri');
  const origin = request.nextUrl.origin;

  if (incoming) {
    if (incoming.startsWith('/')) {
      return `${origin}${incoming}`;
    }
    try {
      const parsed = new URL(incoming);
      if (parsed.origin === origin) {
        return parsed.toString();
      }
    } catch {
      // ignore invalid redirect uri
    }
  }

  return fallback || `${origin}/api/google/oauth/callback`;
}

export const GET = withAuth(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  const userId = (await getAuthUser(request))?.userId ?? null;
  if (!userId) {
    return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
  }
  const state = generateState();
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);

  const { searchParams } = new URL(request.url);
  const oauthService = buildOAuthClientService();
  const { config } = await oauthService.getEffectiveConfig(userId, 'youtube');

  const prompt = searchParams.get('prompt') ?? undefined;
  const authuser = searchParams.get('authuser') ?? undefined;
  const loginHint = searchParams.get('login_hint') ?? undefined;
  const redirectUri = resolveRedirectUri(request, config.redirectUri);

  const redirectUrl = buildAuthUrl(state, challenge, {
    prompt,
    authuser,
    loginHint,
    redirectUri,
    config,
  });
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  response.cookies.set(VERIFIER_COOKIE, verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  response.cookies.set(USER_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  response.cookies.set(REDIRECT_COOKIE, redirectUri, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });

  return withSecurityHeaders(response);
}));
