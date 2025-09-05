import { HttpError } from './HttpError';
import HttpsClient, { RequestMethod } from './HttpsClient';
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

    const response = await fetch(url, config);
    return this.processResponse<R>(response);
  }

  private createRequestConfig(
    method: RequestMethod,
    body?: unknown,
    headers?: Record<string, string>
  ): RequestInit {
    const hasBody = body !== undefined;
    const config: RequestInit = {
      method,
      headers: this.createHeaders(hasBody, headers),
    };
    if (hasBody) {
      config.body = JSON.stringify(body);
    }
    return config;
  }

  private createHeaders(
    hasBody: boolean,
    customHeaders?: Record<string, string>
  ): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...customHeaders,
    };
    if (hasBody) headers['Content-Type'] = 'application/json';
    return headers;
  }

  private async processResponse<T>(response: Response): Promise<T> {
    await throwIfHttpError(response); // Throws if status is not ok
    const { status } = response;
    if (status === 204 || status === 205 || status === 304) {
      return undefined as T;
    }
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const isJson = /\bjson\b/.test(contentType) || contentType.includes('+json');
    if (!isJson) {
      const text = await response.text().catch(() => '');
      if (!text) return undefined as T;
      throw new HttpError({
        status,
        message: 'Response is not JSON',
        cause: response,
      });
    }
    try {
      return (await response.json()) as T;
    } catch {
      throw new HttpError({
        status,
        message: 'Failed to parse JSON response',
        cause: response,
      });
    }
  }
}
