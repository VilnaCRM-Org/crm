import type { RequestConfig, RequestMethod } from './https-client';

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface RequestArgs<R> {
  url: string;
  method: RequestMethod;
  config: RequestConfig<R>;
  body?: unknown;
}

export type { RequestOptions, RequestArgs };
