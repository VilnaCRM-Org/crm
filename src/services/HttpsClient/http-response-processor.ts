import { injectable } from 'tsyringe';

import { HttpError } from '@/services/HttpsClient/HttpError';
import ResponseMessages from '@/services/HttpsClient/responseMessages';

import HttpErrorStatusGuard from './http-error-status-guard';

const NO_BODY_STATUSES = new Set([204, 205, 304]);

@injectable()
export default class HttpResponseProcessor {
  private readonly httpErrorStatusGuard: HttpErrorStatusGuard;

  constructor(httpErrorStatusGuard: HttpErrorStatusGuard = new HttpErrorStatusGuard()) {
    this.httpErrorStatusGuard = httpErrorStatusGuard;
  }

  public async process<T>(response: Response): Promise<T | undefined> {
    await this.httpErrorStatusGuard.assertOk(response);
    if (NO_BODY_STATUSES.has(response.status)) {
      return undefined;
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    return contentType.includes('json')
      ? this.parseJsonBody<T>(response, response.status)
      : this.readNonJsonBody<T>(response, response.status);
  }

  private async parseJsonBody<T>(response: Response, status: number): Promise<T | undefined> {
    try {
      const raw = await response
        .clone()
        .text()
        .catch(() => '');
      if (!raw || raw.trim().length === 0) {
        return undefined;
      }

      return (await response.json()) as T;
    } catch {
      throw new HttpError({ status, message: ResponseMessages.JSON_PARSE_FAILED, cause: response });
    }
  }

  private async readNonJsonBody<T>(response: Response, status: number): Promise<T | undefined> {
    const text = await response.text().catch(() => '');
    if (!text || text.trim().length === 0) {
      return undefined;
    }

    throw new HttpError({ status, message: ResponseMessages.RESPONSE_NOT_JSON, cause: response });
  }
}
