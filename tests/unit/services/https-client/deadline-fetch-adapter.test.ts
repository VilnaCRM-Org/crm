/** @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom */

import 'reflect-metadata';

import RequestDeadlineFactory from '@/lib/reliability/request-deadline-factory';
import DeadlineFetchAdapter from '@/services/https-client/deadline-fetch-adapter';
import { HttpError } from '@/services/https-client/http-error';
import ResponseMessages from '@/services/https-client/response-messages';

const TIMEOUT_MS = 500;

const hangingFetch = (): jest.Mock =>
  jest.fn(
    (_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        });
      })
  );

const settle = async (promise: Promise<unknown>): Promise<unknown> =>
  promise.then(
    (value) => value,
    (error: unknown) => error
  );

describe('DeadlineFetchAdapter', () => {
  const originalFetch = global.fetch;
  let adapter: DeadlineFetchAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    adapter = new DeadlineFetchAdapter(new RequestDeadlineFactory(TIMEOUT_MS));
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
  });

  it('forwards input and init to fetch under a deadline signal', async () => {
    const response = { ok: true, status: 200 } as Response;
    const mockFetch = jest.fn().mockResolvedValue(response);
    global.fetch = mockFetch as unknown as typeof fetch;

    await expect(
      adapter.fetch('https://api.example.test/graphql', { method: 'POST' })
    ).resolves.toBe(response);

    expect(mockFetch).toHaveBeenCalledWith('https://api.example.test/graphql', {
      method: 'POST',
      signal: expect.any(AbortSignal),
    });
    expect(jest.getTimerCount()).toBe(0);
  });

  it('works with no init at all', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = mockFetch as unknown as typeof fetch;

    await adapter.fetch('https://api.example.test/graphql');

    expect(mockFetch).toHaveBeenCalledWith('https://api.example.test/graphql', {
      signal: expect.any(AbortSignal),
    });
  });

  it('reports a request that outlives the timeout as a status-0 timeout error', async () => {
    const mockFetch = hangingFetch();
    global.fetch = mockFetch as unknown as typeof fetch;

    const outcome = settle(adapter.fetch('https://api.example.test/graphql'));
    await jest.advanceTimersByTimeAsync(TIMEOUT_MS - 1);
    expect(jest.getTimerCount()).toBe(1);
    await jest.advanceTimersByTimeAsync(1);
    const error = await outcome;

    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ status: 0, message: ResponseMessages.REQUEST_TIMEOUT });
    expect((error as HttpError).cause).toMatchObject({ name: 'AbortError' });
  });

  it('forwards a caller abort and rethrows it untouched', async () => {
    const mockFetch = hangingFetch();
    global.fetch = mockFetch as unknown as typeof fetch;
    const controller = new AbortController();

    const outcome = settle(
      adapter.fetch('https://api.example.test/graphql', { signal: controller.signal })
    );
    await jest.advanceTimersByTimeAsync(10);
    controller.abort();

    expect(await outcome).toMatchObject({ name: 'AbortError' });
    expect(jest.getTimerCount()).toBe(0);
  });

  it('treats a null caller signal as no caller signal', async () => {
    const mockFetch = hangingFetch();
    global.fetch = mockFetch as unknown as typeof fetch;

    const outcome = settle(adapter.fetch('https://api.example.test/graphql', { signal: null }));
    await jest.advanceTimersByTimeAsync(TIMEOUT_MS);

    expect(await outcome).toMatchObject({ status: 0, message: ResponseMessages.REQUEST_TIMEOUT });
  });

  it('does not call a non-abort failure a timeout even after the deadline expired', async () => {
    const failure = new TypeError('Failed to fetch');
    global.fetch = jest.fn(
      () =>
        new Promise((_resolve, reject) => {
          setTimeout(() => reject(failure), TIMEOUT_MS + 1);
        })
    ) as unknown as typeof fetch;

    const outcome = settle(adapter.fetch('https://api.example.test/graphql'));
    await jest.advanceTimersByTimeAsync(TIMEOUT_MS + 1);

    expect(await outcome).toBe(failure);
  });

  it.each([undefined, null, 'socket hang up', 42, { name: 'TypeError' }])(
    'passes the non-abort rejection %p through untouched after the deadline expired',
    async (rejection) => {
      global.fetch = jest.fn(
        () =>
          new Promise((_resolve, reject) => {
            setTimeout(() => reject(rejection), TIMEOUT_MS + 1);
          })
      ) as unknown as typeof fetch;

      const outcome = settle(adapter.fetch('https://api.example.test/graphql'));
      await jest.advanceTimersByTimeAsync(TIMEOUT_MS + 1);

      expect(await outcome).toBe(rejection);
    }
  );

  it('rethrows a transport failure that is not a timeout untouched', async () => {
    const failure = new TypeError('Failed to fetch');
    global.fetch = jest.fn().mockRejectedValue(failure) as unknown as typeof fetch;

    await expect(adapter.fetch('https://api.example.test/graphql')).rejects.toBe(failure);
    expect(jest.getTimerCount()).toBe(0);
  });
});
