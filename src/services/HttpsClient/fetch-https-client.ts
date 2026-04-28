import { injectable } from 'tsyringe';

import { HttpError } from '@/services/HttpsClient/HttpError';
import HttpRequestConfigBuilder from '@/services/HttpsClient/http-request-config-builder';
import HttpResponseProcessor from '@/services/HttpsClient/http-response-processor';
import ResponseMessages from '@/services/HttpsClient/responseMessages';
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

  constructor(
    requestConfigBuilder: HttpRequestConfigBuilder = new HttpRequestConfigBuilder(),
    responseProcessor: HttpResponseProcessor = new HttpResponseProcessor()
  ) {
    this.requestConfigBuilder = requestConfigBuilder;
    this.responseProcessor = responseProcessor;
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
    if (options?.signal?.aborted) throwAbortError();
    const config = this.createRequestConfig(method, body, options?.headers);
    if (options?.signal) config.signal = options.signal;
    try {
      const response = await fetch(url, config);
      return await this.responseProcessor.process<R>(response);
    } catch (err) {
      return rethrowOrWrapTransportError(err);
    }
  }
}

function throwAbortError(): never {
  const abortError = new Error('The operation was aborted');
  abortError.name = 'AbortError';
  throw abortError;
}

function rethrowOrWrapTransportError(error: unknown): never {
  const isAbortError =
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError';

  if (isAbortError) {
    throw error;
  }

  if (error instanceof HttpError) {
    throw error;
  }

  throw new HttpError({ status: 0, message: ResponseMessages.NETWORK_ERROR, cause: error });
}
