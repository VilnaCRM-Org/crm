import { HttpError } from './HttpError';
import HttpsClient, { RequestMethod } from './HttpsClient';
import ResponseMessages from './responseMessages';
import throwIfHttpError from './throwIfHttpError';

export default class FetchHttpsClient implements HttpsClient {
  public get<T>(url: string, options?: { signal?: AbortSignal }): Promise<T> {
    return this.request<T>(url, 'GET', undefined, undefined, options);
  }

  public post<T, R>(url: string, data: T, options?: { signal?: AbortSignal }): Promise<R> {
    return this.request<R>(url, 'POST', data, undefined, options);
  }

  public put<T, R>(url: string, data: T, options?: { signal?: AbortSignal }): Promise<R> {
    return this.request<R>(url, 'PUT', data, undefined, options);
  }

  public patch<T, R>(url: string, data: T, options?: { signal?: AbortSignal }): Promise<R> {
    return this.request<R>(url, 'PATCH', data, undefined, options);
  }

  public delete<T, R>(url: string, data?: T, options?: { signal?: AbortSignal }): Promise<R> {
    return this.request<R>(url, 'DELETE', data, undefined, options);
  }

  private async request<R>(
    url: string,
    method: RequestMethod,
    body?: unknown,
    headers?: Record<string, string>,
    options?: { signal?: AbortSignal }
  ): Promise<R> {
    const config: RequestInit = this.createRequestConfig(method, body, headers);
    if (options?.signal) config.signal = options.signal;

    try {
      const response = await fetch(url, config);
      return await this.processResponse<R>(response);
    } catch (err) {
      throw new HttpError({ status: 0, message: ResponseMessages.NETWORK_ERROR, cause: err });
    }
  }

  private createRequestConfig(
    method: RequestMethod,
    body?: unknown,
    headers?: Record<string, string>
  ): RequestInit {
    const hasBody = body !== undefined;

    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const isBlob = typeof Blob !== 'undefined' && body instanceof Blob;
    const isArrayBuffer = typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer;
    const isReadableStream =
      typeof ReadableStream !== 'undefined' && body instanceof ReadableStream;
    const isString = typeof body === 'string';
    const isJsonBody =
      hasBody && !isFormData && !isBlob && !isArrayBuffer && !isReadableStream && !isString;

    const config: RequestInit = {
      method,
      headers: this.createHeaders(isJsonBody ? 'application/json' : undefined, headers),
    };
    if (hasBody) {
      config.body = isJsonBody ? JSON.stringify(body) : (body as BodyInit);
    }
    return config;
  }

  private createHeaders(
    contentType?: string,
    customHeaders?: Record<string, string>
  ): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...customHeaders,
    };
    if (contentType && !('Content-Type' in headers)) headers['Content-Type'] = contentType;
    return headers;
  }

  private async processResponse<T>(response: Response): Promise<T> {
    await throwIfHttpError(response);
    const { status } = response;
    if (status === 204 || status === 205 || status === 304) {
      return undefined as T;
    }
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const isJson = /\bjson\b/.test(contentType) || contentType.includes('json');
    if (!isJson) {
      const text = await response.text().catch(() => '');
      if (!text) return undefined as T;
      throw new HttpError({
        status,
        message: ResponseMessages.RESPONSE_NOT_JSON,
        cause: response,
      });
    }
    try {
      const raw = await response
        .clone()
        .text()
        .catch(() => '');
      if (!raw || raw.trim().length === 0) return undefined as T;
      return (await response.json()) as T;
    } catch {
      throw new HttpError({
        status,
        message: ResponseMessages.JSON_PARSE_FAILED,
        cause: response,
      });
    }
  }
}
