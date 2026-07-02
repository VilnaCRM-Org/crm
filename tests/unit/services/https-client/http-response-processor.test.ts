/** @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom */

import { z } from 'zod';

import { HttpError } from '@/services/https-client/http-error';
import HttpResponseProcessor from '@/services/https-client/http-response-processor';
import ResponseMessages from '@/services/https-client/response-messages';

const passthrough = z.unknown();

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

    await expect(
      processor.process(createResponse(204, undefined, ''), passthrough)
    ).resolves.toBeUndefined();
  });

  it('uses the default response parser when constructed with undefined', async () => {
    const processor = new HttpResponseProcessor(undefined);

    await expect(
      processor.process(createResponse(204, undefined, ''), passthrough)
    ).resolves.toBeUndefined();
  });

  it('uses an injected HttpErrorStatusGuard', async () => {
    const parser = { assertOk: jest.fn().mockResolvedValue(undefined) };
    const processor = new HttpResponseProcessor(parser as never);
    const response = createResponse(204, undefined, '');

    await processor.process(response, passthrough);

    expect(parser.assertOk).toHaveBeenCalledWith(response);
  });

  it('parses and returns a body that satisfies the schema (positive)', async () => {
    const processor = new HttpResponseProcessor();
    const schema = z.object({ token: z.string() });

    await expect(processor.process(createResponse(200, { token: 'abc' }), schema)).resolves.toEqual(
      { token: 'abc' }
    );
  });

  it('strips unknown keys the schema does not declare (edge)', async () => {
    const processor = new HttpResponseProcessor();
    const schema = z.object({ token: z.string() });

    await expect(
      processor.process(createResponse(200, { token: 'abc', extra: 'ignored' }), schema)
    ).resolves.toEqual({ token: 'abc' });
  });

  it('throws an HttpError when the body violates the schema (negative)', async () => {
    const processor = new HttpResponseProcessor();
    const schema = z.object({ token: z.string() });

    await expect(
      processor.process(createResponse(200, { token: 123 }), schema)
    ).rejects.toMatchObject({ message: ResponseMessages.INVALID_RESPONSE_SHAPE });
  });

  it('surfaces the schema violation as an HttpError instance', async () => {
    const processor = new HttpResponseProcessor();
    const schema = z.object({ token: z.string() });

    await expect(processor.process(createResponse(200, {}), schema)).rejects.toBeInstanceOf(
      HttpError
    );
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
