import HttpsClient, { GetOptions } from "@/services/HttpsClient/HttpsClient";
import { Logger } from '@/services/Logger';

export default class FetchHttpsClient implements HttpsClient {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public async get(url: string, options: GetOptions): Promise<Response> {
    return fetch(url, {
      method: 'GET',
      headers: this.getHeaders(options.token),
    });
  }

  public post(url: string, options: any): Promise<Response> {
    return fetch(url, {
      method: 'POST',
      headers: this.getHeaders(options.token),
    })
  }

  public patch(url: string, options: any): Promise<Response> {
    return fetch(url, {
      method: 'POST',
      headers: this.getHeaders(options.token),
    })
  }

  public put(url: string, options: any): Promise<Response> {
    return fetch(url, {
      method: 'POST',
      headers: this.getHeaders(options.token),
    })
  }

  public delete(url: string, options: any): Promise<Response> {
    return fetch(url, {
      method: 'POST',
      headers: this.getHeaders(options.token),
    })
  }

  private async processResponse(response: Response): Promise<any> {
    return response;
  }

  private getHeaders(token: string) {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  }
}
