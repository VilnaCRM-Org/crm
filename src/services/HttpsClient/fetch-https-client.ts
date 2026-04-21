import { injectable } from 'tsyringe';

import {
  createRequestConfig as buildRequestConfig,
  processResponse,
  rethrowOrWrap,
  throwAbortError,
} from '@/services/HttpsClient/fetch-helpers';
import HttpsClient, { RequestMethod } from '@/services/HttpsClient/HttpsClient';

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

@injectable()
export default class FetchHttpsClient implements HttpsClient {
  public get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>({ url, method: 'GET', options });
  }

  public post<T, R>(url: string, data: T, options?: RequestOptions): Promise<R> {
    return this.request<R>({ url, method: 'POST', body: data, options });
  }

  public put<T, R>(url: string, data: T, options?: RequestOptions): Promise<R> {
    return this.request<R>({ url, method: 'PUT', body: data, options });
  }

  public patch<T, R>(url: string, data: T, options?: RequestOptions): Promise<R> {
    return this.request<R>({ url, method: 'PATCH', body: data, options });
  }

  public delete<T, R>(url: string, data?: T, options?: RequestOptions): Promise<R> {
    return this.request<R>({ url, method: 'DELETE', body: data, options });
  }

  private createRequestConfig(
    method: RequestMethod,
    body: unknown,
    headers: Record<string, string> | undefined
  ): RequestInit {
    return buildRequestConfig(method, body, headers);
  }

  private async request<R>({ url, method, body, options }: RequestArgs): Promise<R> {
    if (options?.signal?.aborted) throwAbortError();
    const config = this.createRequestConfig(method, body, options?.headers);
    if (options?.signal) config.signal = options.signal;
    try {
      const response = await fetch(url, config);
      return await processResponse<R>(response);
    } catch (err) {
      return rethrowOrWrap(err);
    }
  }
}
