import type { ZodType } from 'zod';

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Per-request config. The response `schema` is required so every REST body is validated
// (never cast) at the boundary; `signal`/`headers` are optional transport concerns.
export interface RequestConfig<R> {
  schema: ZodType<R>;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export interface HttpsClient {
  get<R>(url: string, config: RequestConfig<R>): Promise<R | undefined>;
  post<T, R>(url: string, data: T, config: RequestConfig<R>): Promise<R | undefined>;
  patch<T, R>(url: string, data: T, config: RequestConfig<R>): Promise<R | undefined>;
  put<T, R>(url: string, data: T, config: RequestConfig<R>): Promise<R | undefined>;
  delete<T, R>(url: string, data: T, config: RequestConfig<R>): Promise<R | undefined>;
}
