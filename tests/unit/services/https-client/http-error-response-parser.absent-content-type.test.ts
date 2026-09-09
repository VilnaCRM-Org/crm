import { HttpError } from '@/services/https-client/http-error';
import HttpErrorResponseParser from '@/services/https-client/http-error-response-parser';

interface ErrorCause {
  [key: string]: unknown;
  contentType?: string;
  body?: string;
}

const headerlessErrorResponse = (body: string): Response =>
  ({
    ok: false,
    status: 500,
    statusText: 'Server Error',
    url: 'https://example.test/resource',
    headers: new Headers(),
    text: async (): Promise<string> => body,
    clone: (): Response => headerlessErrorResponse(body),
  }) as unknown as Response;

const rejectionOf = (promise: Promise<unknown>): Promise<unknown> =>
  promise.then(
    () => undefined,
    (error: unknown) => error
  );

describe('HttpErrorResponseParser with no content-type header', () => {
  it('falls back to the status line rather than probing an undeclared media type', async () => {
    const parser = new HttpErrorResponseParser();

    const rejection = await rejectionOf(parser.assertOk(headerlessErrorResponse('boom')));

    expect(rejection).toBeInstanceOf(HttpError);
    expect((rejection as HttpError).message).toBe('500 Server Error');
  });

  it('still captures the body and reports the absent content type as undefined', async () => {
    const parser = new HttpErrorResponseParser();

    const rejection = await rejectionOf(parser.assertOk(headerlessErrorResponse('boom')));
    const cause = (rejection as HttpError).cause as ErrorCause;

    expect(cause.body).toBe('boom');
    expect(cause.contentType).toBeUndefined();
  });

  it('reports no message and no body for a headerless response with an empty body', async () => {
    const parser = new HttpErrorResponseParser();

    const extracted = await parser.parse(headerlessErrorResponse(''));

    expect(extracted).toEqual({ message: null, body: undefined });
  });
});
