import { inject, injectable } from 'tsyringe';

import TOKENS from '@/config/tokens';
import { HttpError } from '@/services/https-client/http-error';
import HttpRequestConfigBuilder from '@/services/https-client/http-request-config-builder';
import HttpResponseProcessor from '@/services/https-client/http-response-processor';
import ResponseMessages from '@/services/https-client/response-messages';
import type { RequestArgs } from '@/services/types/https-client/fetch-https-client';
import type {
  HttpsClient,
  RequestConfig,
  RequestMethod,
} from '@/services/types/https-client/https-client';

@injectable()
export default class FetchHttpsClient implements HttpsClient {
  private readonly requestConfigBuilder: HttpRequestConfigBuilder;

  private readonly responseProcessor: HttpResponseProcessor;

  constructor(
    @inject(TOKENS.HttpRequestConfigBuilder) requestConfigBuilder: HttpRequestConfigBuilder,
    @inject(TOKENS.HttpResponseProcessor) responseProcessor: HttpResponseProcessor
  ) {
    this.requestConfigBuilder = requestConfigBuilder;
    this.responseProcessor = responseProcessor;
  }

  public get<R>(url: string, config: RequestConfig<R>): Promise<R | undefined> {
    return this.request<R>({ url, method: 'GET', config });
  }

  public post<T, R>(url: string, data: T, config: RequestConfig<R>): Promise<R | undefined> {
    return this.request<R>({ url, method: 'POST', body: data, config });
  }

  public put<T, R>(url: string, data: T, config: RequestConfig<R>): Promise<R | undefined> {
    return this.request<R>({ url, method: 'PUT', body: data, config });
  }

  public patch<T, R>(url: string, data: T, config: RequestConfig<R>): Promise<R | undefined> {
    return this.request<R>({ url, method: 'PATCH', body: data, config });
  }

  public delete<T, R>(url: string, data: T, config: RequestConfig<R>): Promise<R | undefined> {
    return this.request<R>({ url, method: 'DELETE', body: data, config });
  }

  private createRequestConfig(
    method: RequestMethod,
    body: unknown,
    headers: Record<string, string> | undefined
  ): RequestInit {
    return this.requestConfigBuilder.create(method, body, headers);
  }

  private async request<R>({ url, method, config, body }: RequestArgs<R>): Promise<R | undefined> {
    if (config.signal?.aborted) this.throwAbortError();
    const requestInit = this.createRequestConfig(method, body, config.headers);
    if (config.signal) requestInit.signal = config.signal;
    try {
      const response = await fetch(url, requestInit);
      return await this.responseProcessor.process<R>(response, config.schema);
    } catch (err) {
      return this.rethrowOrWrapTransportError(err);
    }
  }

  private throwAbortError(): never {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    throw abortError;
  }

  private rethrowOrWrapTransportError(error: unknown): never {
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
}
