/** @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom */

import HttpResponseProcessor from '@/services/https-client/http-response-processor';

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

  it('uses the default response parser when constructed with undefined', async () => {
    const processor = new HttpResponseProcessor(undefined);

    await expect(processor.process(createResponse(204, undefined, ''))).resolves.toBeUndefined();
  });

  it('uses an injected HttpErrorStatusGuard', async () => {
    const parser = { assertOk: jest.fn().mockResolvedValue(undefined) };
    const processor = new HttpResponseProcessor(parser as never);
    const response = createResponse(204, undefined, '');

    await processor.process(response);

    expect(parser.assertOk).toHaveBeenCalledWith(response);
  });

  it('loads when the reflected parser constructor type is unavailable', () => {
    jest.isolateModules(() => {
      jest.doMock('@/services/https-client/http-error-response-parser', () => ({
        __esModule: true,
        default: undefined,
      }));

      expect(require('@/services/https-client/http-response-processor')).toBeDefined();

      jest.dontMock('@/services/https-client/http-error-response-parser');
    });
  });
});
