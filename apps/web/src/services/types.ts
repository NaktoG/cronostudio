export type AuthFetch = (input: string, init?: RequestInit) => Promise<Response>;

export class ServiceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
