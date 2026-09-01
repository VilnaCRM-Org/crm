/** @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom */

import { z } from 'zod';

import { HttpError } from '@/services/https-client/http-error';
import HttpErrorResponseParser from '@/services/https-client/http-error-response-parser';
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
        json: async (): Promise<unknown> => body,
        text: async (): Promise<string> => (body === undefined ? '' : JSON.stringify(body)),
      }) as Response,
  } as Response;
}

function createProcessor(): HttpResponseProcessor {
  return new HttpResponseProcessor(new HttpErrorResponseParser());
}

describe('HttpResponseProcessor', () => {
  it('returns undefined for successful responses with no body', async () => {
    const processor = createProcessor();

    await expect(
      processor.process(createResponse(204, undefined, ''), passthrough)
    ).resolves.toBeUndefined();
  });

  it('routes error statuses through the injected parser', async () => {
    const processor = createProcessor();

    await expect(
      processor.process(createResponse(500, { message: 'server exploded' }), passthrough)
    ).rejects.toMatchObject({ status: 500, message: 'server exploded' });
  });

  it('propagates the injected parser rejection without reading the body', async () => {
    const failure = new HttpError({ status: 503, message: 'unavailable' });
    const parser = new HttpErrorResponseParser();
    jest.spyOn(parser, 'assertOk').mockRejectedValue(failure);
    const processor = new HttpResponseProcessor(parser);
    const response = createResponse(200, { token: 'abc' });
    const readJson = jest.spyOn(response, 'json');

    await expect(processor.process(response, passthrough)).rejects.toBe(failure);

    expect(readJson).not.toHaveBeenCalled();
  });

  it('uses an injected HttpErrorStatusGuard', async () => {
    const parser = { assertOk: jest.fn().mockResolvedValue(undefined) };
    const processor = new HttpResponseProcessor(parser as never);
    const response = createResponse(204, undefined, '');

    await processor.process(response, passthrough);

    expect(parser.assertOk).toHaveBeenCalledWith(response);
  });

  it('parses and returns a body that satisfies the schema (positive)', async () => {
    const processor = createProcessor();
    const schema = z.object({ token: z.string() });

    await expect(processor.process(createResponse(200, { token: 'abc' }), schema)).resolves.toEqual(
      { token: 'abc' }
    );
  });

  it('strips unknown keys the schema does not declare (edge)', async () => {
    const processor = createProcessor();
    const schema = z.object({ token: z.string() });

    await expect(
      processor.process(createResponse(200, { token: 'abc', extra: 'ignored' }), schema)
    ).resolves.toEqual({ token: 'abc' });
  });

  it('throws an HttpError when the body violates the schema (negative)', async () => {
    const processor = createProcessor();
    const schema = z.object({ token: z.string() });

    await expect(
      processor.process(createResponse(200, { token: 123 }), schema)
    ).rejects.toMatchObject({ message: ResponseMessages.INVALID_RESPONSE_SHAPE });
  });

  it('surfaces the schema violation as an HttpError instance', async () => {
    const processor = createProcessor();
    const schema = z.object({ token: z.string() });

    await expect(processor.process(createResponse(200, {}), schema)).rejects.toBeInstanceOf(
      HttpError
    );
  });

  it('rejects an empty 200 body against a required schema (no validation bypass)', async () => {
    const processor = createProcessor();
    const schema = z.object({ token: z.string() });

    await expect(
      processor.process(createResponse(200, undefined, 'application/json'), schema)
    ).rejects.toMatchObject({ message: ResponseMessages.INVALID_RESPONSE_SHAPE });
  });

  it('accepts an empty 200 body against an optional/nullable schema', async () => {
    const processor = createProcessor();

    await expect(
      processor.process(createResponse(200, undefined, 'application/json'), passthrough)
    ).resolves.toBeUndefined();
  });

  it('uses only the injected parser when the parser module export is missing', async () => {
    let loaded: typeof HttpResponseProcessor | undefined;

    jest.isolateModules(() => {
      jest.doMock('@/services/https-client/http-error-response-parser', () => ({
        __esModule: true,
        default: undefined,
      }));

      ({ default: loaded } = require('@/services/https-client/http-response-processor') as {
        default: typeof HttpResponseProcessor;
      });

      jest.dontMock('@/services/https-client/http-error-response-parser');
    });

    expect(loaded).toBeDefined();

    const IsolatedProcessor = loaded as typeof HttpResponseProcessor;
    const parser = { assertOk: jest.fn().mockResolvedValue(undefined) };
    const processor = new IsolatedProcessor(parser as never);
    const response = createResponse(204, undefined, '');

    await expect(processor.process(response, passthrough)).resolves.toBeUndefined();

    expect(parser.assertOk).toHaveBeenCalledWith(response);
  });
});
