import type { RequestMethod } from '@/services/https-client/https-client.types';

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
