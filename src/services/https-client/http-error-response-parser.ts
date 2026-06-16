import { injectable } from 'tsyringe';

import { HttpError } from '@/services/https-client/http-error';

const MAX_ERROR_BODY_CHARS = 500;

interface JsonWithMessage {
  message?: string;
}

export interface ExtractedBody {
  message: string | null;
  body: string | undefined;
}

@injectable()
export default class HttpErrorResponseParser {
  public async assertOk(response: Response): Promise<void> {
    if (response.ok || response.status === 304) {
      return;
    }

    const fallback = `${response.status} ${response.statusText}`;
    const { message, body } = await this.parse(response);

    throw new HttpError({
      status: response.status,
      message: message ?? fallback,
      cause: {
        url: response.url,
        contentType: response.headers.get('content-type') ?? undefined,
        body,
      },
    });
  }

  public async parse(response: Response): Promise<ExtractedBody> {
    const contentType = (response.headers.get('content-type') || '').toLowerCase();

    try {
      if (contentType.includes('json')) {
        return await this.extractJsonBody(response.clone());
      }

      return await this.extractTextBody(response.clone(), contentType);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.warn('Failed to parse HTTP error response', {
        message,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return { message, body: undefined };
    }
  }

  private truncate(value: string): string {
    return value.slice(0, MAX_ERROR_BODY_CHARS);
  }

  private async extractJsonBody(clone: Response): Promise<ExtractedBody> {
    const data = (await clone.json().catch(() => undefined)) as JsonWithMessage | undefined;
    const message = typeof data?.message === 'string' ? this.truncate(data.message) : null;
    const body = data === undefined ? undefined : this.truncate(JSON.stringify(data));
    return { message, body };
  }

  private async extractTextBody(clone: Response, contentType: string): Promise<ExtractedBody> {
    const text = await clone.text().catch(() => '');
    const body = text ? this.truncate(text) : undefined;
    const message = contentType.includes('text/plain') && body ? body : null;
    return { message, body };
  }
}
