import type { ZodType } from 'zod';

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Per-request config. The response `schema` is required so every REST body is validated
// (never cast) at the boundary; `signal`/`headers` are optional transport concerns.
// `timeoutMs` overrides the configured request deadline, and `retry` overrides the default
// retry decision (idempotent methods only) — opt a semantically idempotent POST in, or an
// idempotent method out (issue #147).
export interface RequestConfig<R> {
  schema: ZodType<R>;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retry?: boolean;
}

export interface HttpsClient {
  get<R>(url: string, config: RequestConfig<R>): Promise<R | undefined>;
  post<T, R>(url: string, data: T, config: RequestConfig<R>): Promise<R | undefined>;
  patch<T, R>(url: string, data: T, config: RequestConfig<R>): Promise<R | undefined>;
  put<T, R>(url: string, data: T, config: RequestConfig<R>): Promise<R | undefined>;
  delete<T, R>(url: string, data: T, config: RequestConfig<R>): Promise<R | undefined>;
}
