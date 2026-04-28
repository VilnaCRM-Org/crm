/** @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom */

import HttpResponseProcessor, {
  throwIfHttpError,
} from '@/services/HttpsClient/http-response-processor';

function createResponse(
  status: number,
  body?: unknown,
  contentType = 'application/json'
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(contentType ? { 'content-type': contentType } : {}),
    json: async () => body,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
    clone: () =>
      ({
        text: async (): Promise<string> => (body === undefined ? '' : JSON.stringify(body)),
      }) as Response,
  } as Response;
}

describe('HttpResponseProcessor', () => {
  it('returns undefined for successful responses with no body', async () => {
    const processor = new HttpResponseProcessor();

    await expect(processor.process(createResponse(204, undefined, ''))).resolves.toBeUndefined();
  });

  it('uses an injected HttpErrorStatusGuard', async () => {
    const parser = { assertOk: jest.fn().mockResolvedValue(undefined) };
    const processor = new HttpResponseProcessor(parser as never);
    const response = createResponse(204, undefined, '');

    await processor.process(response);

    expect(parser.assertOk).toHaveBeenCalledWith(response);
  });
});

describe('throwIfHttpError', () => {
  it('reuses the response guard behavior exposed by the response processor module', async () => {
    await expect(throwIfHttpError(createResponse(204, undefined, ''))).resolves.toBeUndefined();
  });

  it('uses an injected parser when provided explicitly', async () => {
    const parser = { assertOk: jest.fn().mockResolvedValue(undefined) };
    const response = createResponse(204, undefined, '');

    await expect(throwIfHttpError(response, parser as never)).resolves.toBeUndefined();
    expect(parser.assertOk).toHaveBeenCalledWith(response);
  });
});
