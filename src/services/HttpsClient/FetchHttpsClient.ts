import HttpsClient, { RequestMethod } from "@/services/HttpsClient/HttpsClient";

export default class FetchHttpsClient implements HttpsClient {
  public get<T>(url: string): Promise<T> {
    return this.request(url, 'GET', null, null) as Promise<T>;
  }

  public post<T>(url: string, data: T): Promise<T> {
    console.log('in FetchHttpsCLient.ts line 9', url, data);
    return this.request(url, 'POST', data, null) as Promise<T>;
  }

  public patch<T>(url: string, data: T): Promise<T> {
    return this.request(url, 'PATCH', data, null) as Promise<T>;
  }

  public put<T>(url: string, data: T): Promise<T> {
    return this.request(url, 'PUT', data, null) as Promise<T>;
  }

  public delete<T>(url: string, data: T): Promise<T> {
    return this.request(url, 'DELETE', data, null) as Promise<T>;
  }

  private async request<T>(url: string, method: RequestMethod, body: T, token: string | null): Promise<T> {
    const config = this.createRequestConfig(method, body, token);
    const response = await fetch(url, config);

    return this.processResponse(response);
  }

  private createRequestConfig<T>(method: RequestMethod, body?: T, token?: string | null): RequestInit {
    return {
      method,
      headers: this.createHeaders(token),
      body: body ? JSON.stringify(body) : undefined,
    };
  }

  private createHeaders(token: string | undefined | null): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && {'Authorization': `Bearer ${token}`}),
    };
  }

  private processResponse<T>(response: Response): Promise<T> {
    return response.json();
  }
}
