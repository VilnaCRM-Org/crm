import 'reflect-metadata';

jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

const enableDsn = (): void => {
  process.env.REACT_APP_SENTRY_DSN = 'https://key@sentry.io/1';
};

const loadClient = async (): Promise<{
  Sentry: typeof import('@sentry/react');
  sentryClient: typeof import('@/services/observability/sentry-client').default;
}> => ({
  Sentry: await import('@sentry/react'),
  sentryClient: (await import('@/services/observability/sentry-client')).default,
});

describe('sentry client (integration)', () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.REACT_APP_SENTRY_DSN;
  });

  afterEach(() => {
    delete process.env.REACT_APP_SENTRY_DSN;
  });

  it('buffers captures and identity before load, then handles live signals', async () => {
    enableDsn();
    const { Sentry, sentryClient } = await loadClient();
    const early = new Error('early');

    sentryClient.captureException(early, { requestId: 'r1' });
    sentryClient.setUser({ id: 'buffered' });
    sentryClient.addBreadcrumb({ message: 'before-load' });
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.setUser).not.toHaveBeenCalled();
    expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();

    await sentryClient.init();
    await sentryClient.init();

    expect(Sentry.init).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenNthCalledWith(1, early, {
      extra: { requestId: 'r1' },
    });
    expect(Sentry.setUser).toHaveBeenNthCalledWith(1, { id: 'buffered' });
    const [setUserOrder = Number.POSITIVE_INFINITY] = (Sentry.setUser as jest.Mock).mock
      .invocationCallOrder;
    const [captureOrder = Number.NEGATIVE_INFINITY] = (Sentry.captureException as jest.Mock).mock
      .invocationCallOrder;

    expect(setUserOrder).toBeLessThan(captureOrder);

    const late = new Error('late');
    sentryClient.captureException(late, { requestId: 'r2' });
    sentryClient.captureException(late);
    sentryClient.setUser({ id: 'live' });
    sentryClient.clearUser();
    sentryClient.addBreadcrumb({ message: 'crumb' });

    expect(Sentry.captureException).toHaveBeenNthCalledWith(2, late, {
      extra: { requestId: 'r2' },
    });
    expect(Sentry.captureException).toHaveBeenNthCalledWith(3, late, undefined);
    expect(Sentry.setUser).toHaveBeenNthCalledWith(2, { id: 'live' });
    expect(Sentry.setUser).toHaveBeenNthCalledWith(3, null);
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({ message: 'crumb' });
  });

  it('loads nothing and drops signals when the DSN is absent', async () => {
    const { Sentry, sentryClient } = await loadClient();

    sentryClient.captureException(new Error('x'));
    sentryClient.setUser({ id: 'x' });
    sentryClient.clearUser();
    await sentryClient.init();

    expect(Sentry.init).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.setUser).not.toHaveBeenCalled();
  });

  it('buffers a pre-load identity clear and applies it on init', async () => {
    enableDsn();
    const { Sentry, sentryClient } = await loadClient();

    sentryClient.clearUser();
    await sentryClient.init();

    expect(Sentry.setUser).toHaveBeenCalledWith(null);
  });

  it('bounds the pending capture buffer during a degraded session', async () => {
    enableDsn();
    const { Sentry, sentryClient } = await loadClient();

    for (let i = 0; i < 130; i += 1) sentryClient.captureException(new Error(`e${i}`));
    await sentryClient.init();

    expect(Sentry.captureException).toHaveBeenCalledTimes(100);
  });

  it('serializes concurrent init calls into one SDK initialization', async () => {
    enableDsn();
    const { Sentry, sentryClient } = await loadClient();

    await Promise.all([sentryClient.init(), sentryClient.init()]);

    expect(Sentry.init).toHaveBeenCalledTimes(1);
  });

  it('rejects when SDK initialization fails so the caller can recover', async () => {
    enableDsn();
    const { Sentry, sentryClient } = await loadClient();
    (Sentry.init as jest.Mock).mockImplementationOnce(() => {
      throw new Error('boom');
    });

    await expect(sentryClient.init()).rejects.toThrow('boom');
  });

  it('caches the loaded SDK module across load calls', async () => {
    enableDsn();
    const { SentryClient } = await import('@/services/observability/sentry-client');
    const client = new SentryClient();
    const load = (client as unknown as { load: () => Promise<unknown> }).load.bind(client);

    const first = await load();
    const second = await load();

    expect(first).toBe(second);
  });

  it('exposes the client as a shared singleton', async () => {
    const { SentryClient } = await import('@/services/observability/sentry-client');
    const sentryClient = (await import('@/services/observability/sentry-client')).default;

    expect(sentryClient).toBeInstanceOf(SentryClient);
  });
});
