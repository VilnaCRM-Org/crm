import type { RequestMethod } from '@/services/types/https-client/https-client';

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface RequestArgs {
  url: string;
  method: RequestMethod;
  body?: unknown;
  options?: RequestOptions;
}

export type { RequestOptions, RequestArgs };
