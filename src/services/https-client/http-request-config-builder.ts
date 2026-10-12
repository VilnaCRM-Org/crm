import { inject, injectable } from 'tsyringe';

import type { CorrelationIdProvider } from '@/services/observability/correlation-id-provider';
import type { SessionCorrelation } from '@/services/observability/session-correlation';
import OBSERVABILITY_TOKENS from '@/services/observability/tokens';
import type { RequestHeaders, RequestMethod } from '@/services/types/https-client/https-client';

@injectable()
export default class HttpRequestConfigBuilder {
  constructor(
    @inject(OBSERVABILITY_TOKENS.CorrelationIdProvider)
    private readonly correlationIds: CorrelationIdProvider,
    @inject(OBSERVABILITY_TOKENS.SessionCorrelation)
    private readonly sessionCorrelation: SessionCorrelation
  ) {}

  public create(
    method: RequestMethod,
    body: unknown,
    headers: RequestHeaders | undefined
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

  private withoutHeader(headers: Record<string, string>, target: string): Record<string, string> {
    const normalizedTarget = target.toLowerCase();
    return Object.fromEntries(
      Object.entries(headers).filter(([name]) => name.toLowerCase() !== normalizedTarget)
    );
  }

  private toHeaderMap(headers: RequestHeaders | undefined): Record<string, string> {
    const merged = new Map<string, string>();
    for (const header of headers?.items ?? []) {
      const previous = merged.get(header.name);
      merged.set(
        header.name,
        previous === undefined ? header.value : `${previous}, ${header.value}`
      );
    }
    return Object.fromEntries(merged);
  }

  private createHeaders(
    contentType: string | undefined,
    customHeaders: RequestHeaders | undefined
  ): Record<string, string> {
    const withoutRequestId = this.withoutHeader(
      this.toHeaderMap(customHeaders),
      this.correlationIds.header
    );
    const nextHeaders = this.withoutHeader(withoutRequestId, this.sessionCorrelation.header);
    nextHeaders[this.correlationIds.header] = this.correlationIds.next();
    nextHeaders[this.sessionCorrelation.header] = this.sessionCorrelation.id();

    if (!this.hasHeader(nextHeaders, 'accept')) {
      nextHeaders.Accept = 'application/json';
    }

    if (contentType && !this.hasHeader(nextHeaders, 'content-type')) {
      nextHeaders['Content-Type'] = contentType;
    }

    return nextHeaders;
  }
}
