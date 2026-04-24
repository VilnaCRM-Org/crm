import { injectable } from 'tsyringe';

import HttpErrorResponseParser from './http-error-response-parser';
import { HttpError } from './HttpError';

@injectable()
export default class HttpErrorStatusGuard {
  private readonly httpErrorResponseParser: HttpErrorResponseParser;

  constructor(httpErrorResponseParser: HttpErrorResponseParser = new HttpErrorResponseParser()) {
    this.httpErrorResponseParser = httpErrorResponseParser;
  }

  public async assertOk(response: Response): Promise<void> {
    if (response.ok || response.status === 304) {
      return;
    }

    const fallback = `${response.status} ${response.statusText}`;
    const { message, body } = await this.httpErrorResponseParser.parse(response);

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
}
