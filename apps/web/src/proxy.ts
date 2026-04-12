import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
];

function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (process.env.NODE_ENV === 'production') {
    if (!raw || raw.trim().length === 0) {
      throw new Error('CORS_ALLOWED_ORIGINS must be set in production.');
    }
  }
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin: string | null): origin is string {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
}

function withCorsHeaders(response: NextResponse, origin: string) {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

const DEFAULT_CSP = {
  defaultSrc: ["'self'"],
  baseUri: ["'self'"],
  frameAncestors: ["'none'"],
  objectSrc: ["'none'"],
  imgSrc: ["'self'", 'data:', 'https:'],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
  connectSrc: ["'self'"],
};

function createNonce(): string {
  return btoa(crypto.randomUUID());
}

function parseDirective(value: string | undefined, fallback: string[]) {
  if (!value) return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildCspHeader(nonce: string): { header: string; reportOnly: boolean } {
  const isProduction = process.env.NODE_ENV === 'production';
  const reportOnlyEnv = process.env.CSP_REPORT_ONLY;
  const reportOnly = reportOnlyEnv ? reportOnlyEnv === 'true' : !isProduction;
  const reportUri = process.env.CSP_REPORT_URI;

  const directives = {
    defaultSrc: parseDirective(process.env.CSP_DEFAULT_SRC, DEFAULT_CSP.defaultSrc),
    baseUri: parseDirective(process.env.CSP_BASE_URI, DEFAULT_CSP.baseUri),
    frameAncestors: parseDirective(process.env.CSP_FRAME_ANCESTORS, DEFAULT_CSP.frameAncestors),
    objectSrc: parseDirective(process.env.CSP_OBJECT_SRC, DEFAULT_CSP.objectSrc),
    imgSrc: parseDirective(process.env.CSP_IMG_SRC, DEFAULT_CSP.imgSrc),
    scriptSrc: parseDirective(process.env.CSP_SCRIPT_SRC, DEFAULT_CSP.scriptSrc),
    styleSrc: parseDirective(process.env.CSP_STYLE_SRC, DEFAULT_CSP.styleSrc),
    fontSrc: parseDirective(process.env.CSP_FONT_SRC, DEFAULT_CSP.fontSrc),
    connectSrc: parseDirective(process.env.CSP_CONNECT_SRC, DEFAULT_CSP.connectSrc),
  };

  const scriptSrc = [
    ...directives.scriptSrc.filter((value) => value !== "'unsafe-inline'"),
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
  ];

  const parts = [
    `default-src ${directives.defaultSrc.join(' ')}`,
    `base-uri ${directives.baseUri.join(' ')}`,
    `frame-ancestors ${directives.frameAncestors.join(' ')}`,
    `object-src ${directives.objectSrc.join(' ')}`,
    `img-src ${directives.imgSrc.join(' ')}`,
    `script-src ${scriptSrc.join(' ')}`,
    `style-src ${directives.styleSrc.join(' ')}`,
    `font-src ${directives.fontSrc.join(' ')}`,
    `connect-src ${directives.connectSrc.join(' ')}`,
    'upgrade-insecure-requests',
  ];

  if (reportUri) {
    parts.push(`report-uri ${reportUri}`);
  }

  return { header: parts.join('; '), reportOnly };
}

function withCspHeaders(response: NextResponse, nonce: string) {
  const { header, reportOnly } = buildCspHeader(nonce);
  response.headers.set(reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy', header);
  response.headers.set('x-nonce', nonce);
  return response;
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get('origin');
  const pathname = request.nextUrl.pathname;
  const isProduction = process.env.NODE_ENV === 'production';
  const requestHeaders = new Headers(request.headers);
  const nonce = createNonce();
  requestHeaders.set('x-nonce', nonce);

  if (pathname.startsWith('/api') && request.method === 'OPTIONS') {
    if (isOriginAllowed(origin)) {
      return withCorsHeaders(new NextResponse(null, { status: 204 }), origin);
    }
    return new NextResponse(null, { status: 403 });
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  if (pathname.startsWith('/api')) {
    if (isOriginAllowed(origin)) {
      return withCorsHeaders(response, origin);
    }
    return response;
  }

  if (isProduction) {
    return withCspHeaders(response, nonce);
  }
  return response;
}

export const config = {
  matcher: ['/:path*'],
};
