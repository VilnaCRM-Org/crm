import type { RequestConfig, RequestHeaders, RequestMethod } from './https-client';

interface RequestOptions {
  headers?: RequestHeaders;
  signal?: AbortSignal | undefined;
}

interface RequestArgs<T, R> {
  url: string;
  method: RequestMethod;
  config: RequestConfig<R>;
  body?: T;
}

export type { RequestOptions, RequestArgs };
