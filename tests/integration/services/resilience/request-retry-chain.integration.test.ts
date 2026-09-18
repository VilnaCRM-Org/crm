import { delay, http, HttpResponse } from 'msw';
import { z } from 'zod';

import '../../setup';
import container from '@/config/dependency-injection-config';
import RequestDeadlineFactory from '@/lib/reliability/request-deadline-factory';
import DeadlineFetchAdapter from '@/services/https-client/deadline-fetch-adapter';
import { HttpError } from '@/services/https-client/http-error';
import ResponseMessages from '@/services/https-client/response-messages';
import HTTP_TOKENS from '@/services/https-client/tokens';
import type RequestRetryService from '@/services/resilience/request-retry-service';
import RESILIENCE_TOKENS from '@/services/resilience/tokens';
import type TransientErrorDetector from '@/services/resilience/transient-error-detector';
import type { HttpsClient } from '@/services/types/https-client/https-client';
import { assertInstanceOf } from '@tests/utils/assert-result';

import server from '../../mocks/server';

const RESOURCE_URL = 'http://localhost:8080/api/resource';
const schema = z.object({ ok: z.boolean() });

// The whole chain is real — container-registered client, retry service, backoff and detector —
// against msw. The jitter is pinned to the bottom of each window so the waits are deterministic.
describe('request retry chain (integration)', () => {
  const client = container.resolve<HttpsClient>(HTTP_TOKENS.HttpsClient);
  const transientErrors = container.resolve<TransientErrorDetector>(
    RESILIENCE_TOKENS.TransientErrorDetector
  );
  let random: jest.SpyInstance;

  beforeEach(() => {
    random = jest.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    random.mockRestore();
    server.resetHandlers();
  });

  const settle = async (promise: Promise<unknown>): Promise<unknown> =>
    promise.then(
      (value) => value,
      (error: unknown) => error
    );

  it('retries a GET that answers 503 and resolves once the backend recovers', async () => {
    let calls = 0;
    server.use(
      http.get(RESOURCE_URL, () => {
        calls += 1;
        return calls < 3
          ? HttpResponse.json({ message: 'unavailable' }, { status: 503 })
          : HttpResponse.json({ ok: true });
      })
    );

    await expect(client.get(RESOURCE_URL, { schema })).resolves.toEqual({ ok: true });

    expect(calls).toBe(3);
  });

  it('gives up after three attempts and surfaces the last transient error', async () => {
    let calls = 0;
    server.use(
      http.get(RESOURCE_URL, () => {
        calls += 1;
        return HttpResponse.json({ message: 'unavailable' }, { status: 503 });
      })
    );

    const error = await settle(client.get(RESOURCE_URL, { schema }));

    assertInstanceOf(error, HttpError);
    expect(error.status).toBe(503);
    expect(calls).toBe(3);
  });

  it('does not retry a permanent failure', async () => {
    let calls = 0;
    server.use(
      http.get(RESOURCE_URL, () => {
        calls += 1;
        return HttpResponse.json({ message: 'nope' }, { status: 404 });
      })
    );

    await expect(client.get(RESOURCE_URL, { schema })).rejects.toMatchObject({ status: 404 });

    expect(calls).toBe(1);
  });

  it('never retries a POST that did not opt in', async () => {
    let calls = 0;
    server.use(
      http.post(RESOURCE_URL, () => {
        calls += 1;
        return HttpResponse.error();
      })
    );

    await expect(client.post(RESOURCE_URL, {}, { schema })).rejects.toMatchObject({
      status: 0,
      message: ResponseMessages.NETWORK_ERROR,
    });

    expect(calls).toBe(1);
  });

  it('retries a POST that opts in and a network failure alike', async () => {
    let calls = 0;
    server.use(
      http.post(RESOURCE_URL, () => {
        calls += 1;
        return calls === 1 ? HttpResponse.error() : HttpResponse.json({ ok: true });
      })
    );

    await expect(client.post(RESOURCE_URL, {}, { schema, retry: true })).resolves.toEqual({
      ok: true,
    });

    expect(calls).toBe(2);
  });

  it('abandons a request that outlives its per-request timeout as a status-0 timeout', async () => {
    server.use(http.get(RESOURCE_URL, () => delay('infinite')));

    const error = await settle(client.get(RESOURCE_URL, { schema, timeoutMs: 150 }));

    assertInstanceOf(error, HttpError);
    expect(error).toMatchObject({ status: 0, message: ResponseMessages.REQUEST_TIMEOUT });
  });

  it('stops retrying when the remaining budget could not fit another attempt', async () => {
    let calls = 0;
    server.use(
      http.get(RESOURCE_URL, async () => {
        calls += 1;
        await delay(200);
        return HttpResponse.json({ message: 'unavailable' }, { status: 503 });
      })
    );

    await expect(client.get(RESOURCE_URL, { schema, timeoutMs: 450 })).rejects.toMatchObject({
      status: 503,
    });

    expect(calls).toBe(1);
  });

  it('stops retrying when the caller aborts during the backoff wait', async () => {
    let calls = 0;
    const controller = new AbortController();
    server.use(
      http.get(RESOURCE_URL, () => {
        calls += 1;
        controller.abort();
        return HttpResponse.json({ message: 'unavailable' }, { status: 503 });
      })
    );

    await expect(
      client.get(RESOURCE_URL, { schema, signal: controller.signal })
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(calls).toBe(1);
  });

  it('rejects at once when the caller aborts mid-wait rather than after the response', async () => {
    let calls = 0;
    const controller = new AbortController();
    server.use(
      http.get(RESOURCE_URL, () => {
        calls += 1;
        setTimeout(() => controller.abort(), 20);
        return HttpResponse.json({ message: 'unavailable' }, { status: 503 });
      })
    );

    await expect(
      client.get(RESOURCE_URL, { schema, signal: controller.signal })
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(calls).toBe(1);
  });

  it('rejects with an AbortError, not a wait, when the abort landed mid-attempt', async () => {
    const retries = container.resolve<RequestRetryService>(RESILIENCE_TOKENS.RequestRetryService);
    const controller = new AbortController();
    const operation = jest.fn(async () => {
      controller.abort();
      throw new HttpError({ status: 503, message: 'unavailable' });
    });

    await expect(
      retries.execute(operation, { budgetMs: 5_000, signal: controller.signal })
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(operation).toHaveBeenCalledTimes(1);
  });

  // msw cannot abort a streamed mock body, so the two body-read outcomes are driven through a
  // fetch stub whose body rejects with the AbortError a browser raises when the signal fires.
  describe('body reads cut short by the deadline', () => {
    // Spied, not reassigned: msw patched global fetch in the suite setup, and restoring a copy
    // captured at definition time would hand the later tests the environment's stub instead.
    const stalledResponse = (status: number): jest.SpyInstance =>
      jest.spyOn(globalThis, 'fetch').mockImplementation(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((resolve) => {
            const body = new Promise<string>((_resolveBody, rejectBody) => {
              init?.signal?.addEventListener('abort', () =>
                rejectBody(Object.assign(new Error('aborted'), { name: 'AbortError' }))
              );
            });
            const response = {
              ok: status < 400,
              status,
              statusText: 'stalled',
              url: RESOURCE_URL,
              headers: new Headers({ 'content-type': 'application/json' }),
              json: (): Promise<unknown> => body,
              text: (): Promise<string> => body,
              clone: (): unknown => response,
            };
            resolve(response as unknown as Response);
          })
      );

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('keeps a 4xx the server already sent when its body read outlives the deadline', async () => {
      stalledResponse(422);

      await expect(client.get(RESOURCE_URL, { schema, timeoutMs: 100 })).rejects.toMatchObject({
        status: 422,
      });
    });

    it('reports a 200 whose body read outlives the deadline as a timeout', async () => {
      stalledResponse(200);

      await expect(client.get(RESOURCE_URL, { schema, timeoutMs: 100 })).rejects.toMatchObject({
        status: 0,
        message: ResponseMessages.REQUEST_TIMEOUT,
      });
    });
  });

  it('classifies transient and permanent failures through the container-resolved detector', () => {
    expect(transientErrors.is(new HttpError({ status: 502, message: 'gateway' }))).toBe(true);
    expect(transientErrors.is(new HttpError({ status: 429, message: 'slow down' }))).toBe(false);
    expect(transientErrors.is({ status: '503' })).toBe(false);
    expect(transientErrors.is(Object.assign(new Error('x'), { name: 'AbortError' }))).toBe(false);
    expect(transientErrors.is(null)).toBe(false);
  });

  describe('deadline fetch for GraphQL', () => {
    it('reports a stalled GraphQL fetch as a status-0 timeout', async () => {
      server.use(http.post(RESOURCE_URL, () => delay('infinite')));
      const adapter = new DeadlineFetchAdapter(new RequestDeadlineFactory(150));

      const error = await settle(adapter.fetch(RESOURCE_URL, { method: 'POST' }));

      assertInstanceOf(error, HttpError);
      expect(error).toMatchObject({ status: 0, message: ResponseMessages.REQUEST_TIMEOUT });
    });

    it('returns the response and its body when the backend answers in time', async () => {
      server.use(http.post(RESOURCE_URL, () => HttpResponse.json({ data: { ok: true } })));
      const adapter = container.resolve<DeadlineFetchAdapter>(HTTP_TOKENS.DeadlineFetchAdapter);

      const response = await adapter.fetch(RESOURCE_URL, { method: 'POST' });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ data: { ok: true } });
    });

    it('hands a body-less response back as it is', async () => {
      server.use(http.post(RESOURCE_URL, () => new HttpResponse(null, { status: 204 })));
      const adapter = container.resolve<DeadlineFetchAdapter>(HTTP_TOKENS.DeadlineFetchAdapter);

      const response = await adapter.fetch(RESOURCE_URL, { method: 'POST' });

      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
    });

    it('lets the consumer cancel the bounded body', async () => {
      server.use(http.post(RESOURCE_URL, () => HttpResponse.json({ data: { ok: true } })));
      const adapter = container.resolve<DeadlineFetchAdapter>(HTTP_TOKENS.DeadlineFetchAdapter);

      const response = await adapter.fetch(RESOURCE_URL, { method: 'POST' });

      await expect(response.body?.cancel('done')).resolves.toBeUndefined();
    });

    it('reports a body that stalls past the deadline as a status-0 timeout', async () => {
      const stalled = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation((_input: RequestInfo | URL, init?: RequestInit) =>
          Promise.resolve(
            new Response(
              new ReadableStream<Uint8Array>({
                pull: (): Promise<void> =>
                  new Promise((_resolve, reject) => {
                    init?.signal?.addEventListener('abort', () =>
                      reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
                    );
                  }),
              }),
              { status: 200, headers: { 'content-type': 'application/json' } }
            )
          )
        );
      try {
        const adapter = new DeadlineFetchAdapter(new RequestDeadlineFactory(100));
        const response = await adapter.fetch(RESOURCE_URL, { method: 'POST' });

        const error = await settle(response.text());

        assertInstanceOf(error, HttpError);
        expect(error).toMatchObject({ status: 0, message: ResponseMessages.REQUEST_TIMEOUT });
      } finally {
        stalled.mockRestore();
      }
    });

    it('does not call a non-abort failure a timeout even after the deadline expired', async () => {
      const failure = new TypeError('socket hang up');
      const stalled = jest.spyOn(globalThis, 'fetch').mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            setTimeout(() => reject(failure), 200);
          })
      );
      try {
        const adapter = new DeadlineFetchAdapter(new RequestDeadlineFactory(50));

        await expect(adapter.fetch(RESOURCE_URL, { method: 'POST' })).rejects.toBe(failure);
      } finally {
        stalled.mockRestore();
      }
    });

    it('rethrows a caller abort untouched, including one that is already aborted', async () => {
      server.use(http.post(RESOURCE_URL, () => delay('infinite')));
      const adapter = new DeadlineFetchAdapter(new RequestDeadlineFactory(1_000));
      const aborted = new AbortController();
      aborted.abort();

      await expect(
        adapter.fetch(RESOURCE_URL, { method: 'POST', signal: aborted.signal })
      ).rejects.toMatchObject({ name: 'AbortError' });

      const live = new AbortController();
      const pending = settle(adapter.fetch(RESOURCE_URL, { method: 'POST', signal: live.signal }));
      live.abort();
      expect(await pending).toMatchObject({ name: 'AbortError' });
    });
  });
});
