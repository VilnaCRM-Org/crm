/** @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom */

import HttpResponseProcessor from '@/services/HttpsClient/http-response-processor';

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
    const guard = { assertOk: jest.fn().mockResolvedValue(undefined) };
    const processor = new HttpResponseProcessor(guard as never);
    const response = createResponse(204, undefined, '');

    await processor.process(response);

    expect(guard.assertOk).toHaveBeenCalledWith(response);
  });
});
