import 'reflect-metadata';

import { z } from 'zod';

import FetchHttpsClient from '@/services/https-client/fetch-https-client';
import { HttpError } from '@/services/https-client/http-error';
import HttpRequestConfigBuilder from '@/services/https-client/http-request-config-builder';
import HttpResponseProcessor from '@/services/https-client/http-response-processor';
import ResponseMessages from '@/services/https-client/response-messages';

jest.mock('uuid', () => ({ v4: (): string => 'test-request-id' }));

const passthrough = z.unknown();
const TEST_URL = '/api/test';

function createOkResponse(): Response {
  const payload = { ok: true };
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async (): Promise<unknown> => payload,
    clone: (): Response =>
      ({ text: async (): Promise<string> => JSON.stringify(payload) }) as Response,
  } as unknown as Response;
}

describe('FetchHttpsClient transport edges', () => {
  const originalFetch = global.fetch;
  let mockFetch: jest.Mock;
  let client: FetchHttpsClient;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
    client = new FetchHttpsClient(new HttpRequestConfigBuilder(), new HttpResponseProcessor());
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('abort signal wiring', () => {
    it('omits the signal property entirely when no AbortSignal is configured', async () => {
      mockFetch.mockResolvedValue(createOkResponse());

      await client.get(TEST_URL, { schema: passthrough });

      const requestInit = mockFetch.mock.calls[0][1] as RequestInit;
      expect(Object.prototype.hasOwnProperty.call(requestInit, 'signal')).toBe(false);
      expect(Object.keys(requestInit)).toEqual(['method', 'headers']);
    });

    it('forwards the configured AbortSignal on the request', async () => {
      mockFetch.mockResolvedValue(createOkResponse());
      const controller = new AbortController();

      await client.get(TEST_URL, { schema: passthrough, signal: controller.signal });

      const requestInit = mockFetch.mock.calls[0][1] as RequestInit;
      expect(Object.prototype.hasOwnProperty.call(requestInit, 'signal')).toBe(true);
      expect(requestInit.signal).toBe(controller.signal);
    });
  });

  describe('non-object transport failures', () => {
    it('wraps a null rejection in a network HttpError', async () => {
      mockFetch.mockRejectedValue(null);

      const request = client.get(TEST_URL, { schema: passthrough });

      await expect(request).rejects.toBeInstanceOf(HttpError);
      await expect(request).rejects.toMatchObject({
        status: 0,
        message: ResponseMessages.NETWORK_ERROR,
        cause: null,
      });
    });

    it('wraps an undefined rejection in a network HttpError', async () => {
      mockFetch.mockRejectedValue(undefined);

      const request = client.get(TEST_URL, { schema: passthrough });

      await expect(request).rejects.toBeInstanceOf(HttpError);
      await expect(request).rejects.toMatchObject({
        status: 0,
        message: ResponseMessages.NETWORK_ERROR,
      });
    });

    it('wraps a bare string rejection in a network HttpError', async () => {
      mockFetch.mockRejectedValue('socket hang up');

      const request = client.get(TEST_URL, { schema: passthrough });

      await expect(request).rejects.toBeInstanceOf(HttpError);
      await expect(request).rejects.toMatchObject({
        status: 0,
        message: ResponseMessages.NETWORK_ERROR,
        cause: 'socket hang up',
      });
    });

    it('still rethrows an AbortError untouched', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      await expect(client.get(TEST_URL, { schema: passthrough })).rejects.toBe(abortError);
    });
  });
});
