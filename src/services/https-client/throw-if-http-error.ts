import type {
  JsonWithMessage,
  BodyMeta,
  ErrorMeta,
} from '@/services/types/https-client/throw-if-http-error';

import { HttpError } from './http-error';

const BODY_PREVIEW_LIMIT = 200;
const MESSAGE_LIMIT = 500;

class HttpErrorThrower {
  public async throwIfError(res: Response): Promise<void> {
    if (res.ok || res.status === 304) return;
    const { message, bodyMeta } = await this.extractErrorMeta(res);
    throw new HttpError({
      status: res.status,
      message: message ?? `${res.status} ${res.statusText}`,
      cause: {
        url: res.url,
        contentType: res.headers.get('content-type') ?? undefined,
        ...(bodyMeta ?? {}),
      },
    });
  }

  private async extractErrorMeta(res: Response): Promise<ErrorMeta> {
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const cloned = res.clone();
    if (ct.includes('json')) return this.extractJsonMeta(cloned);
    const message = await this.extractTextMessage(cloned, ct);
    return { message };
  }

  private async extractJsonMeta(res: Response): Promise<ErrorMeta> {
    const data = await res.json().catch(() => undefined);
    if (data === undefined) return {};
    const candidate =
      typeof data === 'object' && data !== null ? (data as JsonWithMessage).message : undefined;
    const message = typeof candidate === 'string' ? candidate.slice(0, MESSAGE_LIMIT) : undefined;
    return { message, bodyMeta: this.buildBodyPreview(data) };
  }

  private async extractTextMessage(res: Response, ct: string): Promise<string | undefined> {
    const text = await res.text().catch(() => '');
    return ct.includes('text/plain') && text ? text.slice(0, MESSAGE_LIMIT) : undefined;
  }

  private buildBodyPreview(data: unknown): BodyMeta {
    let serialized: string;
    try {
      serialized = typeof data === 'string' ? data : JSON.stringify(data);
    } catch {
      serialized = String(data);
    }
    return {
      bodyPreview: serialized.slice(0, BODY_PREVIEW_LIMIT),
      bodyLength: serialized.length,
    };
  }
}

const httpErrorThrower = new HttpErrorThrower();

export default httpErrorThrower;
