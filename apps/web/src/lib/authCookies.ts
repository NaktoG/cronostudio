import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const REFRESH_COOKIE = 'refresh_token';
const ACCESS_COOKIE = 'access_token';

function parseDurationToSeconds(value: string): number {
  const match = /^([0-9]+)([smhd])$/.exec(value);
  if (!match) return 30 * 24 * 60 * 60;
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };
  return amount * (multipliers[unit] || 24 * 60 * 60);
}

export function setRefreshCookie(response: NextResponse, token: string) {
  const maxAge = parseDurationToSeconds(config.jwt.refreshExpiresIn);
  response.cookies.set(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge,
  });
}

export function clearRefreshCookie(response: NextResponse) {
  response.cookies.set(REFRESH_COOKIE, '', {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

export function setAccessCookie(response: NextResponse, token: string) {
  response.cookies.set(ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: parseDurationToSeconds(config.jwt.expiresIn),
  });
}

export function clearAccessCookie(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, '', {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

export function getRefreshCookie(request: Request | NextRequest): string | null {
  return readCookie(request, REFRESH_COOKIE);
}

export function getAccessCookie(request: Request | NextRequest): string | null {
  return readCookie(request, ACCESS_COOKIE);
}

function readCookie(request: Request | NextRequest, name: string): string | null {
  // NextRequest exposes a cookies helper
  const nextReq = request as NextRequest;
  if (typeof nextReq.cookies?.get === 'function') {
    const value = nextReq.cookies.get(name)?.value;
    if (value) return value;
  }

  const header = request.headers.get('cookie') || '';
  const match = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split('=')[1] || '');
}
