import { injectable } from 'tsyringe';

import {
  HttpRequestConfigBuilder,
  HttpResponseProcessor,
  HttpTransportErrorHandler,
} from '@/services/HttpsClient/fetch-helpers';
import HttpsClient, { RequestMethod } from '@/services/HttpsClient/https-client';

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
  private readonly requestConfigBuilder: HttpRequestConfigBuilder;

  private readonly responseProcessor: HttpResponseProcessor;

  private readonly transportErrorHandler: HttpTransportErrorHandler;

  constructor(
    requestConfigBuilder: HttpRequestConfigBuilder = new HttpRequestConfigBuilder(),
    responseProcessor: HttpResponseProcessor = new HttpResponseProcessor(),
    transportErrorHandler: HttpTransportErrorHandler = new HttpTransportErrorHandler()
  ) {
    this.requestConfigBuilder = requestConfigBuilder;
    this.responseProcessor = responseProcessor;
    this.transportErrorHandler = transportErrorHandler;
  }

  public get<T>(url: string, options?: RequestOptions): Promise<T | undefined> {
    return this.request<T>({ url, method: 'GET', options });
  }

  public post<T, R>(url: string, data: T, options?: RequestOptions): Promise<R | undefined> {
    return this.request<R>({ url, method: 'POST', body: data, options });
  }

  public put<T, R>(url: string, data: T, options?: RequestOptions): Promise<R | undefined> {
    return this.request<R>({ url, method: 'PUT', body: data, options });
  }

  public patch<T, R>(url: string, data: T, options?: RequestOptions): Promise<R | undefined> {
    return this.request<R>({ url, method: 'PATCH', body: data, options });
  }

  public delete<T, R>(url: string, data?: T, options?: RequestOptions): Promise<R | undefined> {
    return this.request<R>({ url, method: 'DELETE', body: data, options });
  }

  private createRequestConfig(
    method: RequestMethod,
    body: unknown,
    headers: Record<string, string> | undefined
  ): RequestInit {
    return this.requestConfigBuilder.create(method, body, headers);
  }

  private async request<R>({ url, method, body, options }: RequestArgs): Promise<R | undefined> {
    if (options?.signal?.aborted) this.transportErrorHandler.throwAbortError();
    const config = this.createRequestConfig(method, body, options?.headers);
    if (options?.signal) config.signal = options.signal;
    try {
      const response = await fetch(url, config);
      return await this.responseProcessor.process<R>(response);
    } catch (err) {
      return this.transportErrorHandler.rethrowOrWrap(err);
    }
  }
}
