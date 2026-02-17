import { NextRequest } from 'next/server';

const BASE_URL = 'http://cronostudio.test';
export const WEBHOOK_HEADER = 'x-cronostudio-webhook-secret';

type NextRequestInit = ConstructorParameters<typeof NextRequest>[1];
type RequestInitWithHeaders = Omit<NonNullable<NextRequestInit>, 'headers'> & {
  headers?: Record<string, string>;
};

export function makeApiRequest(path: string, init: RequestInitWithHeaders = {}): NextRequest {
  const url = `${BASE_URL}${path}`;
  return new NextRequest(url, init as NextRequestInit);
}
