import HttpsClient, { RequestMethod } from './HttpsClient';

export default class FetchHttpsClient implements HttpsClient {
  public get<T>(url: string): Promise<T> {
    return this.request<T>(url, 'GET');
  }

  public post<T, R>(url: string, data: T, headers?: Record<string, string>): Promise<R> {
    return this.request<R>(url, 'POST', data, headers);
  }

  public put<T, R>(url: string, data: T, headers?: Record<string, string>): Promise<R> {
    return this.request<R>(url, 'PUT', data, headers);
  }

  public patch<T, R>(url: string, data: T, headers?: Record<string, string>): Promise<R> {
    return this.request<R>(url, 'PATCH', data, headers);
  }

  public delete<T, R>(url: string, data?: T, headers?: Record<string, string>): Promise<R> {
    return this.request<R>(url, 'DELETE', data, headers);
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

  private createRequestConfig<T>(
    method: RequestMethod,
    body?: T,
    headers?: Record<string, string>
  ): RequestInit {
    return {
      method,
      headers: this.createHeaders(headers),
      body: body ? JSON.stringify(body) : undefined,
    };
  }

  private createHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...customHeaders,
    };
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
