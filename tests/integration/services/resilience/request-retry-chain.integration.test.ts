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

    it('returns the response when the backend answers in time', async () => {
      server.use(http.post(RESOURCE_URL, () => HttpResponse.json({ data: {} })));
      const adapter = container.resolve<DeadlineFetchAdapter>(HTTP_TOKENS.DeadlineFetchAdapter);

      const response = await adapter.fetch(RESOURCE_URL, { method: 'POST' });

      expect(response.status).toBe(200);
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
