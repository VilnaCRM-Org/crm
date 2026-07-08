import * as Sentry from '@sentry/react';

import { SentryClient } from '@/services/observability/sentry-client';

jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

const enableDsn = (): void => {
  process.env.REACT_APP_SENTRY_DSN = 'https://key@sentry.io/1';
};

describe('SentryClient', () => {
  afterEach(() => {
    delete process.env.REACT_APP_SENTRY_DSN;
    jest.clearAllMocks();
  });

  it('does not initialize the SDK when the DSN is absent', async () => {
    await new SentryClient().init();

    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('initializes the SDK only once when the DSN is present', async () => {
    enableDsn();
    const client = new SentryClient();

    await client.init();
    await client.init();

    expect(Sentry.init).toHaveBeenCalledTimes(1);
  });

  it('drops captures before load when the DSN is absent', () => {
    new SentryClient().captureException(new Error('early'));

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('buffers captures taken before the SDK loads and flushes them on init', async () => {
    enableDsn();
    const client = new SentryClient();
    const error = new Error('early');

    client.captureException(error, { requestId: 'r1' });
    expect(Sentry.captureException).not.toHaveBeenCalled();

    await client.init();

    expect(Sentry.captureException).toHaveBeenCalledWith(error, { extra: { requestId: 'r1' } });
  });

  it('buffers identity set before the SDK loads and applies it on init', async () => {
    enableDsn();
    const client = new SentryClient();

    client.setUser({ id: 'buffered' });
    expect(Sentry.setUser).not.toHaveBeenCalled();

    await client.init();

    expect(Sentry.setUser).toHaveBeenCalledWith({ id: 'buffered' });
  });

  it('buffers a clear taken before the SDK loads and applies it on init', async () => {
    enableDsn();
    const client = new SentryClient();

    client.clearUser();
    await client.init();

    expect(Sentry.setUser).toHaveBeenCalledWith(null);
  });

  it('bounds the pending capture buffer while the SDK is unavailable', async () => {
    enableDsn();
    const client = new SentryClient();

    for (let i = 0; i < 150; i += 1) client.captureException(new Error(`e${i}`));
    await client.init();

    expect(Sentry.captureException).toHaveBeenCalledTimes(100);
  });

  it('rejects on a failed SDK init and re-initializes on a later retry', async () => {
    enableDsn();
    (Sentry.init as jest.Mock).mockImplementationOnce(() => {
      throw new Error('init boom');
    });
    const client = new SentryClient();

    await expect(client.init()).rejects.toThrow('init boom');

    await client.init();

    expect(Sentry.init).toHaveBeenCalledTimes(2);
  });

  it('ignores a concurrent init while one is already in flight', async () => {
    enableDsn();
    const client = new SentryClient();

    await Promise.all([client.init(), client.init()]);

    expect(Sentry.init).toHaveBeenCalledTimes(1);
  });

  it('captures exceptions with and without extra context', async () => {
    enableDsn();
    const client = new SentryClient();
    await client.init();
    const error = new Error('boom');

    client.captureException(error, { requestId: 'r1' });
    client.captureException(error);

    expect(Sentry.captureException).toHaveBeenNthCalledWith(1, error, {
      extra: { requestId: 'r1' },
    });
    expect(Sentry.captureException).toHaveBeenNthCalledWith(2, error, undefined);
  });

  it('only tags identity and breadcrumbs after the SDK is loaded', async () => {
    const client = new SentryClient();

    client.setUser({ id: 'a' });
    client.clearUser();
    client.addBreadcrumb({ message: 'ignored' });
    expect(Sentry.setUser).not.toHaveBeenCalled();
    expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();

    enableDsn();
    await client.init();
    client.setUser({ id: 'a' });
    client.clearUser();
    client.addBreadcrumb({ message: 'crumb' });

    expect(Sentry.setUser).toHaveBeenNthCalledWith(1, { id: 'a' });
    expect(Sentry.setUser).toHaveBeenNthCalledWith(2, null);
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({ message: 'crumb' });
  });

  it('scrubs PII through the configured beforeSend hook', async () => {
    enableDsn();
    const client = new SentryClient();
    await client.init();

    const options = (Sentry.init as jest.Mock).mock.calls[0][0];
    const scrubbed = options.beforeSend({ extra: { password: 'secret', route: '/sign-in' } });

    expect(scrubbed).toEqual({ extra: { route: '/sign-in' } });
  });

  it('caches the loaded SDK module', async () => {
    enableDsn();
    const client = new SentryClient();
    const load = (client as unknown as { load: () => Promise<unknown> }).load.bind(client);

    const first = await load();
    const second = await load();

    expect(first).toBe(second);
  });
});
