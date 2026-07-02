import { inject, injectable } from 'tsyringe';
import type { ZodType } from 'zod';

import TOKENS from '@/config/tokens';
import { HttpError } from '@/services/https-client/http-error';
import HttpErrorResponseParser from '@/services/https-client/http-error-response-parser';
import ResponseMessages from '@/services/https-client/response-messages';

const NO_BODY_STATUSES = new Set([204, 205, 304]);

@injectable()
export default class HttpResponseProcessor {
  private readonly httpErrorResponseParser: HttpErrorResponseParser;

  constructor(
    @inject(TOKENS.HttpErrorResponseParser)
    httpErrorResponseParser: HttpErrorResponseParser = new HttpErrorResponseParser()
  ) {
    this.httpErrorResponseParser = httpErrorResponseParser;
  }

  public async process<T>(response: Response, schema: ZodType<T>): Promise<T | undefined> {
    await this.httpErrorResponseParser.assertOk(response);
    if (NO_BODY_STATUSES.has(response.status)) {
      return undefined;
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    return contentType.includes('json')
      ? this.parseJsonBody<T>(response, response.status, schema)
      : this.readNonJsonBody<T>(response, response.status);
  }

  private async parseJsonBody<T>(
    response: Response,
    status: number,
    schema: ZodType<T>
  ): Promise<T | undefined> {
    const raw = await response
      .clone()
      .text()
      .catch(() => '');
    // An empty/whitespace body is still validated against the schema: a required schema
    // rejects it (no silent bypass), while optional/nullable schemas accept the absent value.
    if (!raw || raw.trim().length === 0) {
      return this.validate(undefined, status, schema);
    }

    return this.validate(await this.readJson(response, status), status, schema);
  }

  private async readJson(response: Response, status: number): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      throw new HttpError({ status, message: ResponseMessages.JSON_PARSE_FAILED, cause: response });
    }
  }

  private validate<T>(body: unknown, status: number, schema: ZodType<T>): T {
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new HttpError({
        status,
        message: ResponseMessages.INVALID_RESPONSE_SHAPE,
        cause: result.error,
      });
    }
    return result.data;
  }

  private async readNonJsonBody<T>(response: Response, status: number): Promise<T | undefined> {
    const text = await response.text().catch(() => '');
    if (!text || text.trim().length === 0) {
      return undefined;
    }

    throw new HttpError({ status, message: ResponseMessages.RESPONSE_NOT_JSON, cause: response });
  }
}
