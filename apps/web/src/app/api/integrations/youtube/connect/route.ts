import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { buildAuthUrl, generateCodeChallenge, generateCodeVerifier, generateState } from '@/lib/youtube/oauth';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'yt_oauth_state';
const VERIFIER_COOKIE = 'yt_oauth_verifier';
const USER_COOKIE = 'yt_oauth_user';
const COOKIE_MAX_AGE = 10 * 60; // 10 minutes

export const GET = withAuth(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  const userId = getAuthUser(request)?.userId ?? null;
  if (!userId) {
    return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
  }
  const state = generateState();
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);

  const redirectUrl = buildAuthUrl(state, challenge);
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

  return withSecurityHeaders(response);
}));
