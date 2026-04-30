import { injectable } from 'tsyringe';

import { RequestMethod } from '@/services/HttpsClient/https-client';

@injectable()
export default class HttpRequestConfigBuilder {
  public create(
    method: RequestMethod,
    body: unknown,
    headers: Record<string, string> | undefined
  ): RequestInit {
    const hasBody = body !== undefined && body !== null;
    const normalizedMethod = String(method).toUpperCase();
    const canSendBody = normalizedMethod !== 'GET' && normalizedMethod !== 'HEAD';
    const isJsonBody = hasBody && canSendBody && !this.isBodyInit(body);
    const config: RequestInit = {
      method,
      headers: this.createHeaders(isJsonBody ? 'application/json' : undefined, headers),
    };

    if (hasBody && canSendBody) {
      config.body = isJsonBody ? JSON.stringify(body) : (body as BodyInit);
    }

    return config;
  }

  private getBodyInitCtors(): Array<new (...args: never[]) => object> {
    const constructors: Array<new (...args: never[]) => object> = [];
    const globalObject = globalThis as Record<string, unknown>;

    for (const name of ['FormData', 'Blob', 'ArrayBuffer', 'URLSearchParams', 'ReadableStream']) {
      const ctor = globalObject[name];
      if (typeof ctor === 'function') {
        constructors.push(ctor as new (...args: never[]) => object);
      }
    }

    return constructors;
  }

  private isBodyInit(body: unknown): boolean {
    if (typeof body === 'string') {
      return true;
    }

    for (const ctor of this.getBodyInitCtors()) {
      if (body instanceof ctor) {
        return true;
      }
    }

    return typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(body);
  }

  private hasHeader(headers: Record<string, string>, target: string): boolean {
    const normalizedTarget = target.toLowerCase();
    return Object.keys(headers).some((name) => name.toLowerCase() === normalizedTarget);
  }

  private createHeaders(
    contentType: string | undefined,
    customHeaders?: Record<string, string>
  ): Record<string, string> {
    const nextHeaders: Record<string, string> = { ...customHeaders };

    if (!this.hasHeader(nextHeaders, 'accept')) {
      nextHeaders.Accept = 'application/json';
    }

    if (contentType && !this.hasHeader(nextHeaders, 'content-type')) {
      nextHeaders['Content-Type'] = contentType;
    }

    return nextHeaders;
  }
}
