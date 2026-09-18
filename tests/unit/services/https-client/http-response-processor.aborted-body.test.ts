/** @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom */

import { z } from 'zod';

import { HttpError } from '@/services/https-client/http-error';
import HttpErrorResponseParser from '@/services/https-client/http-error-response-parser';
import HttpResponseProcessor from '@/services/https-client/http-response-processor';
import ResponseMessages from '@/services/https-client/response-messages';
import securityEventCore from '@/services/security-events/security-event-core';

const passthrough = z.unknown();

const abortError = (): Error => Object.assign(new Error('aborted'), { name: 'AbortError' });

const createProcessor = (): HttpResponseProcessor =>
  new HttpResponseProcessor(new HttpErrorResponseParser(securityEventCore));

const okResponse = (overrides: Partial<Response>, contentType = 'application/json'): Response =>
  ({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': contentType }),
    ...overrides,
  }) as Response;

// A body read cut short by the request deadline or the caller is an abort, not a malformed
// body (issue #147): it must reach the client as an AbortError so it can be classified.
describe('HttpResponseProcessor — aborted body reads', () => {
  it('rethrows an abort raised while reading a JSON body', async () => {
    const abort = abortError();
    const response = okResponse({
      clone: (): Response => ({ text: (): Promise<string> => Promise.reject(abort) }) as Response,
    });

    await expect(createProcessor().process(response, passthrough)).rejects.toBe(abort);
  });

  it('rethrows an abort raised while parsing the JSON body', async () => {
    const abort = abortError();
    const response = okResponse({
      clone: (): Response => ({ text: async (): Promise<string> => '{"ok":true}' }) as Response,
      json: (): Promise<unknown> => Promise.reject(abort),
    });

    await expect(createProcessor().process(response, passthrough)).rejects.toBe(abort);
  });

  it('rethrows an abort raised while reading a non-JSON body', async () => {
    const abort = abortError();
    const response = okResponse(
      { text: (): Promise<string> => Promise.reject(abort) },
      'text/plain'
    );

    await expect(createProcessor().process(response, passthrough)).rejects.toBe(abort);
  });

  it('still treats any other JSON parse failure as a malformed body', async () => {
    const response = okResponse({
      clone: (): Response => ({ text: async (): Promise<string> => '{oops' }) as Response,
      json: (): Promise<unknown> => Promise.reject(new SyntaxError('Unexpected token')),
    });

    const request = createProcessor().process(response, passthrough);

    await expect(request).rejects.toBeInstanceOf(HttpError);
    await expect(request).rejects.toMatchObject({
      status: 200,
      message: ResponseMessages.JSON_PARSE_FAILED,
    });
  });

  it.each([new TypeError('body stream locked'), 'boom', null, { name: 'TimeoutError' }])(
    'still swallows the non-abort read failure %p into an absent body',
    async (failure) => {
      const response = okResponse({
        clone: (): Response =>
          ({ text: (): Promise<string> => Promise.reject(failure) }) as Response,
      });

      await expect(createProcessor().process(response, passthrough)).resolves.toBeUndefined();
    }
  );

  it('still swallows a non-abort failure of a non-JSON body read', async () => {
    const response = okResponse(
      { text: (): Promise<string> => Promise.reject(new TypeError('body stream locked')) },
      'text/plain'
    );

    await expect(createProcessor().process(response, passthrough)).resolves.toBeUndefined();
  });
});
