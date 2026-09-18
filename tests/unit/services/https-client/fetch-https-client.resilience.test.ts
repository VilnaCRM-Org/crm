/** @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom */

import 'reflect-metadata';

import { z } from 'zod';

import RequestDeadlineFactory from '@/lib/reliability/request-deadline-factory';
import FetchHttpsClient from '@/services/https-client/fetch-https-client';
import { HttpError } from '@/services/https-client/http-error';
import HttpErrorResponseParser from '@/services/https-client/http-error-response-parser';
import HttpRequestConfigBuilder from '@/services/https-client/http-request-config-builder';
import HttpResponseProcessor from '@/services/https-client/http-response-processor';
import ResponseMessages from '@/services/https-client/response-messages';
import correlationIdProvider from '@/services/observability/correlation-id-provider';
import sessionCorrelation from '@/services/observability/session-correlation';
import ExponentialBackoffStrategy from '@/services/resilience/exponential-backoff-strategy';
import RequestRetryService from '@/services/resilience/request-retry-service';
import TransientErrorDetector from '@/services/resilience/transient-error-detector';
import securityEventCore from '@/services/security-events/security-event-core';
import type { RequestMethod } from '@/services/types/https-client/https-client';

const passthrough = z.unknown();
const URL_UNDER_TEST = '/api/resource';
const DEFAULT_TIMEOUT_MS = 1_000;

const okResponse = (payload: unknown = { ok: true }): Response =>
  ({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async (): Promise<unknown> => payload,
    clone: (): Response =>
      ({ text: async (): Promise<string> => JSON.stringify(payload) }) as Response,
  }) as unknown as Response;

const errorResponse = (status: number): Response => {
  const response = {
    ok: false,
    status,
    statusText: 'error',
    url: URL_UNDER_TEST,
    headers: new Headers(),
    json: async (): Promise<unknown> => ({}),
    text: async (): Promise<string> => '',
    clone: (): unknown => response,
  };
  return response as unknown as Response;
};

// A fetch that never settles on its own: it rejects with an AbortError when its signal fires.
const hangingFetch = (): jest.Mock =>
  jest.fn(
    (_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }));
        });
      })
  );

const createClient = (retries: RequestRetryService = createRetries()): FetchHttpsClient =>
  new FetchHttpsClient({
    requestConfigBuilder: new HttpRequestConfigBuilder(correlationIdProvider, sessionCorrelation),
    responseProcessor: new HttpResponseProcessor(new HttpErrorResponseParser(securityEventCore)),
    deadlines: new RequestDeadlineFactory(DEFAULT_TIMEOUT_MS),
    retries,
  });

function createRetries(): RequestRetryService {
  return new RequestRetryService(new ExponentialBackoffStrategy(), new TransientErrorDetector());
}

const settle = async (promise: Promise<unknown>): Promise<unknown> =>
  promise.then(
    (value) => value,
    (error: unknown) => error
  );

describe('FetchHttpsClient resilience', () => {
  const originalFetch = global.fetch;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    mockFetch = jest.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    global.fetch = originalFetch;
  });

  describe('request deadline', () => {
    it('abandons a request that exceeds the timeout as a status-0 timeout error', async () => {
      mockFetch = hangingFetch();
      global.fetch = mockFetch as unknown as typeof fetch;
      const client = createClient();

      const outcome = settle(client.post(URL_UNDER_TEST, {}, { schema: passthrough }));
      await jest.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS);
      const error = await outcome;

      expect(error).toBeInstanceOf(HttpError);
      expect(error).toMatchObject({ status: 0, message: ResponseMessages.REQUEST_TIMEOUT });
      expect((error as HttpError).cause).toMatchObject({ name: 'AbortError' });
    });

    it('honours a per-request timeout override', async () => {
      mockFetch = hangingFetch();
      global.fetch = mockFetch as unknown as typeof fetch;
      const client = createClient();

      const outcome = settle(
        client.post(URL_UNDER_TEST, {}, { schema: passthrough, timeoutMs: 100 })
      );
      await jest.advanceTimersByTimeAsync(99);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(1);

      expect(await outcome).toMatchObject({ status: 0, message: ResponseMessages.REQUEST_TIMEOUT });
    });

    it('rethrows a caller abort as an AbortError, not as a timeout', async () => {
      mockFetch = hangingFetch();
      global.fetch = mockFetch as unknown as typeof fetch;
      const controller = new AbortController();
      const client = createClient();

      const outcome = settle(
        client.post(URL_UNDER_TEST, {}, { schema: passthrough, signal: controller.signal })
      );
      await jest.advanceTimersByTimeAsync(10);
      controller.abort();

      expect(await outcome).toMatchObject({ name: 'AbortError' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('releases the deadline once the response is processed so no timer outlives it', async () => {
      mockFetch.mockResolvedValue(okResponse());
      const client = createClient();

      await expect(client.get(URL_UNDER_TEST, { schema: passthrough })).resolves.toEqual({
        ok: true,
      });

      expect(jest.getTimerCount()).toBe(0);
    });

    it('reports a body read that stalls past the deadline as a timeout', async () => {
      mockFetch.mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((resolve) => {
            const body = new Promise((_resolveBody, rejectBody) => {
              init.signal?.addEventListener('abort', () => {
                rejectBody(Object.assign(new Error('aborted'), { name: 'AbortError' }));
              });
            });
            resolve({
              ok: true,
              status: 200,
              headers: new Headers({ 'content-type': 'application/json' }),
              clone: (): Response =>
                ({ text: (): Promise<string> => body as Promise<string> }) as Response,
            });
          })
      );
      const client = createClient();

      const outcome = settle(
        client.post(URL_UNDER_TEST, {}, { schema: z.object({ ok: z.boolean() }) })
      );
      await jest.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS);

      expect(await outcome).toMatchObject({ status: 0, message: ResponseMessages.REQUEST_TIMEOUT });
    });
  });

  describe('retry policy', () => {
    it.each<RequestMethod>(['GET', 'PUT', 'DELETE'])(
      'retries an idempotent %s after a transient 503 and resolves with the eventual body',
      async (method) => {
        mockFetch.mockResolvedValueOnce(errorResponse(503)).mockResolvedValueOnce(okResponse());
        const client = createClient();
        const send = (): Promise<unknown> =>
          method === 'GET'
            ? client.get(URL_UNDER_TEST, { schema: passthrough })
            : client[method === 'PUT' ? 'put' : 'delete'](
                URL_UNDER_TEST,
                {},
                { schema: passthrough }
              );

        const result = send();
        await jest.advanceTimersByTimeAsync(0);
        expect(mockFetch).toHaveBeenCalledTimes(1);
        await jest.advanceTimersByTimeAsync(125);

        await expect(result).resolves.toEqual({ ok: true });
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect((mockFetch.mock.calls[1][1] as RequestInit).method).toBe(method);
      }
    );

    it.each<RequestMethod>(['POST', 'PATCH'])(
      'never retries a %s that did not opt in, so a create cannot run twice',
      async (method) => {
        mockFetch.mockResolvedValue(errorResponse(503));
        const client = createClient();
        const send = (): Promise<unknown> =>
          client[method === 'POST' ? 'post' : 'patch'](URL_UNDER_TEST, {}, { schema: passthrough });

        await expect(send()).rejects.toMatchObject({ status: 503 });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
      }
    );

    it('retries a POST that opts in with `retry: true`', async () => {
      mockFetch.mockResolvedValueOnce(errorResponse(503)).mockResolvedValueOnce(okResponse());
      const client = createClient();

      const result = client.post(URL_UNDER_TEST, {}, { schema: passthrough, retry: true });
      await jest.advanceTimersByTimeAsync(125);

      await expect(result).resolves.toEqual({ ok: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('does not retry a GET that opts out with `retry: false`', async () => {
      mockFetch.mockResolvedValue(errorResponse(503));
      const client = createClient();

      await expect(
        client.get(URL_UNDER_TEST, { schema: passthrough, retry: false })
      ).rejects.toMatchObject({ status: 503 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('does not retry a non-transient failure such as a 404', async () => {
      mockFetch.mockResolvedValue(errorResponse(404));
      const client = createClient();

      await expect(client.get(URL_UNDER_TEST, { schema: passthrough })).rejects.toMatchObject({
        status: 404,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('retries a network failure and gives up after three attempts', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
      const client = createClient();

      const outcome = settle(client.get(URL_UNDER_TEST, { schema: passthrough }));
      await jest.advanceTimersByTimeAsync(125 + 250);

      expect(await outcome).toMatchObject({ status: 0, message: ResponseMessages.NETWORK_ERROR });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('bounds the whole retried request by one timeout budget', async () => {
      mockFetch = hangingFetch();
      global.fetch = mockFetch as unknown as typeof fetch;
      const client = createClient();

      const outcome = settle(client.get(URL_UNDER_TEST, { schema: passthrough }));
      await jest.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS);

      expect(await outcome).toMatchObject({ status: 0, message: ResponseMessages.REQUEST_TIMEOUT });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(0);
    });

    it('hands each attempt only the budget that is left', async () => {
      mockFetch
        .mockResolvedValueOnce(errorResponse(503))
        .mockImplementationOnce(hangingFetch() as never);
      const client = createClient();

      const outcome = settle(client.get(URL_UNDER_TEST, { schema: passthrough }));
      await jest.advanceTimersByTimeAsync(125);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      await jest.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS - 125);

      expect(await outcome).toMatchObject({ status: 0, message: ResponseMessages.REQUEST_TIMEOUT });
      expect(jest.getTimerCount()).toBe(0);
    });

    it('stops retrying when the caller aborts during the backoff wait', async () => {
      mockFetch.mockResolvedValue(errorResponse(503));
      const controller = new AbortController();
      const client = createClient();

      const outcome = settle(
        client.get(URL_UNDER_TEST, { schema: passthrough, signal: controller.signal })
      );
      await jest.advanceTimersByTimeAsync(10);
      controller.abort();
      await jest.advanceTimersByTimeAsync(1_000);

      expect(await outcome).toMatchObject({ name: 'AbortError' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('rejects at once with an AbortError when the signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();
      const client = createClient();

      await expect(
        client.get(URL_UNDER_TEST, { schema: passthrough, signal: controller.signal })
      ).rejects.toMatchObject({ name: 'AbortError' });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('uses the retry service the client was constructed with', async () => {
      mockFetch.mockResolvedValue(okResponse());
      const execute = jest.fn(
        (operation: (slot: { attempt: number; remainingMs: number }) => Promise<unknown>) =>
          operation({ attempt: 1, remainingMs: 5 })
      );
      const client = createClient({ execute } as unknown as RequestRetryService);

      await expect(client.get(URL_UNDER_TEST, { schema: passthrough })).resolves.toEqual({
        ok: true,
      });

      expect(execute).toHaveBeenCalledWith(expect.any(Function), {
        budgetMs: DEFAULT_TIMEOUT_MS,
        signal: undefined,
      });
    });
  });
});
