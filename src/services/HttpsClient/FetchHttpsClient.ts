import HttpsClient, { RequestMethod } from './HttpsClient';

export default class FetchHttpsClient implements HttpsClient {
  public get<T>(url: string): Promise<T> {
    return this.request<T>(url, 'GET');
  }

  public post<T, R>(url: string, data: T): Promise<R> {
    return this.request<R>(url, 'POST', data);
  }

  public put<T, R>(url: string, data: T): Promise<R> {
    return this.request<R>(url, 'PUT', data);
  }

  public patch<T, R>(url: string, data: T): Promise<R> {
    return this.request<R>(url, 'PATCH', data);
  }

  public delete<T, R>(url: string, data?: T): Promise<R> {
    return this.request<R>(url, 'DELETE', data);
  }

  private async request<R>(
    url: string,
    method: RequestMethod,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<R> {
    const config = this.createRequestConfig(method, body, headers);
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
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Response is not JSON');
    }
    try {
      return await response.json();
    } catch (error) {
      throw new Error('Failed to parse JSON response');
    }
  }
}
