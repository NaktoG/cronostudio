import { NextRequest, type RequestInit } from 'next/server';

const BASE_URL = 'http://cronostudio.test';
export const WEBHOOK_HEADER = 'x-cronostudio-webhook-secret';

type RequestInitWithHeaders = RequestInit & { headers?: Record<string, string> };

export function makeApiRequest(path: string, init: RequestInitWithHeaders = {}): NextRequest {
  const url = `${BASE_URL}${path}`;
  return new NextRequest(url, init);
}
