import { inject, injectable } from 'tsyringe';

import type RequestDeadline from '@/lib/reliability/request-deadline';
import { HttpError } from '@/services/https-client/http-error';
import ResponseMessages from '@/services/https-client/response-messages';
import type { RequestArgs } from '@/services/types/https-client/fetch-https-client';
import type {
  HttpsClient,
  RequestConfig,
  RequestMethod,
} from '@/services/types/https-client/https-client';
import type { HttpsClientDeps } from '@/services/types/https-client/https-client-deps';

import HTTP_TOKENS from './tokens';

// Retried by default: a repeat of these cannot create a second resource. POST and PATCH opt in
// per request (`config.retry`) when the caller knows the operation is idempotent (issue #147).
const IDEMPOTENT_METHODS: ReadonlySet<RequestMethod> = new Set(['GET', 'PUT', 'DELETE']);

@injectable()
export default class FetchHttpsClient implements HttpsClient {
  constructor(@inject(HTTP_TOKENS.HttpsClientDeps) private readonly deps: HttpsClientDeps) {}

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

  private async request<R>(args: RequestArgs<R>): Promise<R | undefined> {
    const { config, method } = args;
    if (config.signal?.aborted) this.throwAbortError();
    const budgetMs = config.timeoutMs ?? this.deps.deadlines.defaultTimeoutMs();
    if (!(config.retry ?? IDEMPOTENT_METHODS.has(method))) {
      return this.attempt(args, budgetMs);
    }

    return this.deps.retries.execute((slot) => this.attempt(args, slot.remainingMs), {
      budgetMs,
      signal: config.signal,
    });
  }

  private async attempt<R>(
    { url, method, config, body }: RequestArgs<R>,
    timeoutMs: number
  ): Promise<R | undefined> {
    const deadline = this.deps.deadlines.create(config.signal, timeoutMs);
    const requestInit = this.deps.requestConfigBuilder.create(method, body, config.headers);
    requestInit.signal = deadline.signal;
    try {
      const response = await fetch(url, requestInit);
      return await this.deps.responseProcessor.process<R>(response, config.schema);
    } catch (err) {
      return this.rethrowOrWrapTransportError(err, deadline);
    } finally {
      deadline.release();
    }
  }

  private throwAbortError(): never {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    throw abortError;
  }

  // An HttpError already names what the server said and wins over the deadline: a 4xx whose
  // body read was cut short is still a 4xx. Only an abort raised by the expired deadline becomes
  // the timeout; a caller abort passes through untouched.
  private rethrowOrWrapTransportError(error: unknown, deadline: RequestDeadline): never {
    if (error instanceof HttpError) throw error;

    const isAbortError =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: unknown }).name === 'AbortError';

    if (isAbortError && deadline.timedOut) {
      throw new HttpError({ status: 0, message: ResponseMessages.REQUEST_TIMEOUT, cause: error });
    }
    if (isAbortError) throw error;

    throw new HttpError({ status: 0, message: ResponseMessages.NETWORK_ERROR, cause: error });
  }
}
