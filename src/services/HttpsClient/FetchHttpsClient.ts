import HttpError from './HttpError';
import HttpsClient, { RequestMethod } from './HttpsClient';

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
    const config: RequestInit = {
      method,
      headers: this.createHeaders(method, headers),
    };
    if (body !== undefined) {
      config.body = JSON.stringify(body);
    }
    return config;
  }

  private createHeaders(
    method: RequestMethod,
    customHeaders?: Record<string, string>
  ): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...customHeaders,
    };
    if (method !== 'GET' && method !== 'DELETE') {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  private async processResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new HttpError({
        status: response.status,
        message: errorText || response.statusText,
      });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new HttpError({
        status: response.status,
        message: 'Response is not JSON',
      });
    }

    try {
      return await response.json();
    } catch {
      throw new HttpError({
        status: response.status,
        message: 'Failed to parse JSON response',
      });
    }
  }
}
