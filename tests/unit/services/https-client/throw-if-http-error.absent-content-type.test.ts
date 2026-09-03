import { HttpError } from '@/services/https-client/http-error';
import httpErrorThrower from '@/services/https-client/throw-if-http-error';

interface ErrorCause {
  [key: string]: unknown;
  contentType?: string;
  bodyPreview?: string;
}

const headerlessErrorResponse = (body: string): Response =>
  ({
    ok: false,
    status: 503,
    statusText: 'Unavailable',
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

describe('throwIfError with no content-type header', () => {
  it('falls back to the status line rather than probing an undeclared media type', async () => {
    const response = headerlessErrorResponse('service is down');

    const rejection = await rejectionOf(httpErrorThrower.throwIfError(response));

    expect(rejection).toBeInstanceOf(HttpError);
    expect((rejection as HttpError).message).toBe('503 Unavailable');
  });

  it('reports the absent content type as undefined and previews no JSON body', async () => {
    const response = headerlessErrorResponse('service is down');

    const rejection = await rejectionOf(httpErrorThrower.throwIfError(response));
    const cause = (rejection as HttpError).cause as ErrorCause;

    expect(cause.contentType).toBeUndefined();
    expect(cause.bodyPreview).toBeUndefined();
  });
});
