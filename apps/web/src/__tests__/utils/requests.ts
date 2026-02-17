import { NextRequest } from 'next/server';

const BASE_URL = 'http://cronostudio.test';
export const WEBHOOK_HEADER = 'x-cronostudio-webhook-secret';

type RequestInitWithHeaders = Omit<RequestInit, 'headers' | 'signal'> & {
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export function makeApiRequest(path: string, init: RequestInitWithHeaders = {}): NextRequest {
  const url = `${BASE_URL}${path}`;
  return new NextRequest(url, init as RequestInit);
}
