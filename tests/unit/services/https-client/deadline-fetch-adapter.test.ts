// Runs under the project's jsdom-fetch environment: the bounded body is a real ReadableStream
// re-wrapped in a real Response, which the plain Stryker jsdom environment does not provide.
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
    // Only the clock is faked: the web streams the bounded body is built on pump themselves
    // through microtasks and immediates, which must keep running for a read to complete.
    jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'nextTick', 'setImmediate'] });
    adapter = new DeadlineFetchAdapter(new RequestDeadlineFactory(TIMEOUT_MS));
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
  });

  it('forwards input and init to fetch under a deadline signal', async () => {
    const response = { ok: true, status: 200, body: null } as Response;
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
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 200, body: null });
    global.fetch = mockFetch as unknown as typeof fetch;

    await adapter.fetch('https://api.example.test/graphql');

    expect(mockFetch).toHaveBeenCalledWith('https://api.example.test/graphql', {
      signal: expect.any(AbortSignal),
    });
  });

  describe('body consumption', () => {
    const encode = (text: string): Uint8Array => new TextEncoder().encode(text);

    // A body that yields one chunk per pull, and whose next read rejects with an AbortError as
    // soon as the fetch signal fires — the shape a browser produces when the deadline expires
    // after the headers have arrived.
    const streamingResponse = (
      chunks: string[],
      options: { stallAfter?: number; status?: number } = {}
    ): jest.Mock =>
      jest.fn((_url: string, init: RequestInit) => {
        let index = 0;
        const body = new ReadableStream<Uint8Array>({
          pull(controller): Promise<void> {
            if (options.stallAfter !== undefined && index === options.stallAfter) {
              return new Promise((_resolve, reject) => {
                init.signal?.addEventListener('abort', () =>
                  reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
                );
              });
            }
            if (index >= chunks.length) {
              controller.close();
              return Promise.resolve();
            }
            controller.enqueue(encode(chunks[index] ?? ''));
            index += 1;
            return Promise.resolve();
          },
        });
        return Promise.resolve(
          new Response(body, {
            status: options.status ?? 200,
            statusText: 'OK',
            headers: { 'content-type': 'application/json' },
          })
        );
      });

    it('streams the body through and releases the deadline once it has been read', async () => {
      global.fetch = streamingResponse(['{"data":', '{"ok":true}}']) as unknown as typeof fetch;

      const response = await adapter.fetch('https://api.example.test/graphql');
      expect(jest.getTimerCount()).toBe(1);

      await expect(response.text()).resolves.toBe('{"data":{"ok":true}}');
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/json');
      expect(jest.getTimerCount()).toBe(0);
    });

    it('reports a body that stalls past the deadline as a status-0 timeout', async () => {
      global.fetch = streamingResponse(['{"data":'], { stallAfter: 1 }) as unknown as typeof fetch;

      const response = await adapter.fetch('https://api.example.test/graphql');
      const outcome = settle(response.text());
      await jest.advanceTimersByTimeAsync(TIMEOUT_MS);
      const error = await outcome;

      expect(error).toBeInstanceOf(HttpError);
      expect(error).toMatchObject({ status: 0, message: ResponseMessages.REQUEST_TIMEOUT });
      expect(jest.getTimerCount()).toBe(0);
    });

    it('passes a caller abort during the body read through untouched', async () => {
      global.fetch = streamingResponse(['{"data":'], { stallAfter: 1 }) as unknown as typeof fetch;
      const controller = new AbortController();

      const response = await adapter.fetch('https://api.example.test/graphql', {
        signal: controller.signal,
      });
      const outcome = settle(response.text());
      await jest.advanceTimersByTimeAsync(10);
      controller.abort();

      expect(await outcome).toMatchObject({ name: 'AbortError' });
      expect(jest.getTimerCount()).toBe(0);
    });

    it('releases the deadline and cancels the source when the consumer cancels', async () => {
      global.fetch = streamingResponse(['{"data":'], { stallAfter: 1 }) as unknown as typeof fetch;

      const response = await adapter.fetch('https://api.example.test/graphql');
      expect(jest.getTimerCount()).toBe(1);

      await response.body?.cancel('no longer needed');

      expect(jest.getTimerCount()).toBe(0);
    });

    it('swallows a source that refuses to be cancelled so the cancel still settles', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(
          new Response(
            new ReadableStream<Uint8Array>({
              pull: (): Promise<void> => new Promise(() => undefined),
              cancel: (): Promise<void> => Promise.reject(new Error('source refused')),
            }),
            { status: 200 }
          )
        )
      ) as unknown as typeof fetch;

      const response = await adapter.fetch('https://api.example.test/graphql');

      await expect(response.body?.cancel('done')).resolves.toBeUndefined();
      expect(jest.getTimerCount()).toBe(0);
    });

    it('keeps the status of an error response whose body streams normally', async () => {
      global.fetch = streamingResponse(['{"errors":[]}'], {
        status: 422,
      }) as unknown as typeof fetch;

      const response = await adapter.fetch('https://api.example.test/graphql');

      expect(response.status).toBe(422);
      expect(response.statusText).toBe('OK');
      await expect(response.text()).resolves.toBe('{"errors":[]}');
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
