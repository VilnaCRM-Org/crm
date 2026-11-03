import { print } from 'graphql';

import { CurrentUserDocument } from '@/api/generated/graphql';
import CurrentUserClient from '@/modules/user/features/settings/utils/current-user-client';
import ApiError from '@/modules/user/lib/api-errors/api-error';
import sessionCorrelation from '@/services/observability/session-correlation';
import { buildHttpUrl, buildToken } from '@tests/builders';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

const ORIGINAL_ENV = { ...process.env };

const request = (
  signal: AbortSignal = new AbortController().signal
): {
  token: string;
  requestId: string;
  signal: AbortSignal;
} => ({ token: buildToken(), requestId: crypto.randomUUID(), signal });

const answer = (text: string, status = 200): jest.SpyInstance =>
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(text, { status }));

const sentInit = (fetchSpy: jest.SpyInstance): RequestInit =>
  (fetchSpy.mock.calls[0]?.[1] ?? {}) as RequestInit;

const sentUrl = (fetchSpy: jest.SpyInstance): unknown => fetchSpy.mock.calls[0]?.[0];

const hold = (): jest.SpyInstance =>
  jest.spyOn(globalThis, 'fetch').mockImplementation(
    (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        const abort = (): void =>
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        if (init?.signal?.aborted) abort();
        init?.signal?.addEventListener('abort', abort);
      })
  );

describe('CurrentUserClient', () => {
  beforeEach(() => {
    clearConfigBlock();
    delete process.env.REACT_APP_REQUEST_TIMEOUT_MS;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    clearConfigBlock();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns the status and the body text of the answer', async () => {
    answer('{"data":null}', 418);

    await expect(new CurrentUserClient().send(request())).resolves.toEqual({
      status: 418,
      text: '{"data":null}',
    });
  });

  it('posts the CurrentUser operation the profile repository sends, with its headers', async () => {
    const fetchSpy = answer('{}');
    const sent = request();

    await new CurrentUserClient().send(sent);

    const init = sentInit(fetchSpy);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      accept: '*/*',
      'content-type': 'application/json',
      authorization: `Bearer ${sent.token}`,
      'X-Request-Id': sent.requestId,
      'X-Correlation-Id': sessionCorrelation.id(),
    });
    expect(JSON.parse(String(init.body))).toEqual({
      operationName: 'CurrentUser',
      variables: {},
      query: print(CurrentUserDocument),
    });
  });

  it('sends to the runtime GraphQL URL when the runtime block sets one', async () => {
    const graphqlUrl = buildHttpUrl('/graphql');
    process.env.REACT_APP_GRAPHQL_URL = buildHttpUrl('/build-time');
    writeConfigBlock(JSON.stringify({ graphqlUrl }));
    const fetchSpy = answer('{}');

    await new CurrentUserClient().send(request());

    expect(sentUrl(fetchSpy)).toBe(graphqlUrl);
  });

  it('falls back to the build-time GraphQL URL without a runtime one', async () => {
    const buildTime = buildHttpUrl('/build-time');
    process.env.REACT_APP_GRAPHQL_URL = buildTime;
    const fetchSpy = answer('{}');

    await new CurrentUserClient().send(request());

    expect(sentUrl(fetchSpy)).toBe(buildTime);
  });

  it('falls back to the local GraphQL server when nothing configures one', async () => {
    delete process.env.REACT_APP_GRAPHQL_URL;
    const fetchSpy = answer('{}');

    await new CurrentUserClient().send(request());

    expect(sentUrl(fetchSpy)).toBe('http://localhost:4000/graphql');
  });

  it('refuses to default to localhost in production and sends nothing', async () => {
    delete process.env.REACT_APP_GRAPHQL_URL;
    process.env = { ...process.env, NODE_ENV: 'production' };
    const fetchSpy = answer('{}');

    await expect(new CurrentUserClient().send(request())).rejects.toThrow(
      'A GraphQL URL must be defined in production environment. Cannot default to localhost.'
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('still uses a configured GraphQL URL in production', async () => {
    const buildTime = buildHttpUrl('/build-time');
    process.env = { ...process.env, NODE_ENV: 'production', REACT_APP_GRAPHQL_URL: buildTime };
    const fetchSpy = answer('{}');

    await new CurrentUserClient().send(request());

    expect(sentUrl(fetchSpy)).toBe(buildTime);
  });

  it('rethrows a transport failure as it is', async () => {
    const failure = new TypeError('Failed to fetch');
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(failure);

    await expect(new CurrentUserClient().send(request())).rejects.toBe(failure);
  });

  it('rethrows the abort of the caller as it is', async () => {
    hold();
    const controller = new AbortController();
    const sending = new CurrentUserClient().send(request(controller.signal));

    controller.abort();

    await expect(sending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('hands fetch an aborted signal for a caller that aborted before the send', async () => {
    jest.useFakeTimers();
    const fetchSpy = hold();
    const controller = new AbortController();
    controller.abort();

    const outcome = new CurrentUserClient()
      .send(request(controller.signal))
      .catch((caught: unknown) => caught);
    await jest.advanceTimersByTimeAsync(10_000);

    expect(sentInit(fetchSpy).signal?.aborted).toBe(true);
    await expect(outcome).resolves.toMatchObject({ name: 'AbortError' });
    await expect(outcome).resolves.not.toBeInstanceOf(ApiError);
  });

  it('turns an expired default deadline into the retryable timeout error', async () => {
    jest.useFakeTimers();
    hold();
    const sending = new CurrentUserClient().send(request());
    const outcome = sending.catch((caught: unknown) => caught);

    await jest.advanceTimersByTimeAsync(9_999);
    const early = await Promise.race([outcome, Promise.resolve('pending')]);
    await jest.advanceTimersByTimeAsync(1);

    expect(early).toBe('pending');
    const error = await outcome;
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, code: 'TIMEOUT', message: 'Request timed out' });
    expect((error as ApiError).cause).toMatchObject({ name: 'AbortError' });
  });

  it('bounds the read by the configured request timeout', async () => {
    jest.useFakeTimers();
    process.env.REACT_APP_REQUEST_TIMEOUT_MS = '2500';
    const fetchSpy = hold();
    const client = new CurrentUserClient();
    const outcome = client.send(request()).catch((caught: unknown) => caught);

    await jest.advanceTimersByTimeAsync(2_499);
    expect(sentInit(fetchSpy).signal?.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(1);

    await expect(outcome).resolves.toMatchObject({ status: 0, message: 'Request timed out' });
  });

  it.each(['0', '-5', '1.5', 'soon'])(
    'keeps the 10 s default for a request timeout of %s',
    async (configured) => {
      jest.useFakeTimers();
      process.env.REACT_APP_REQUEST_TIMEOUT_MS = configured;
      const fetchSpy = hold();
      const outcome = new CurrentUserClient().send(request()).catch((caught: unknown) => caught);

      await jest.advanceTimersByTimeAsync(9_999);
      expect(sentInit(fetchSpy).signal?.aborted).toBe(false);
      await jest.advanceTimersByTimeAsync(1);

      await expect(outcome).resolves.toMatchObject({ status: 0, message: 'Request timed out' });
    }
  );

  it('releases the deadline once the body is read', async () => {
    jest.useFakeTimers();
    const fetchSpy = answer('{}');

    await new CurrentUserClient().send(request());
    await jest.advanceTimersByTimeAsync(10_000);

    expect(sentInit(fetchSpy).signal?.aborted).toBe(false);
  });

  it('releases the deadline when the transport fails', async () => {
    jest.useFakeTimers();
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));

    await expect(new CurrentUserClient().send(request())).rejects.toThrow('offline');
    await jest.advanceTimersByTimeAsync(10_000);

    expect(sentInit(fetchSpy).signal?.aborted).toBe(false);
  });
});
