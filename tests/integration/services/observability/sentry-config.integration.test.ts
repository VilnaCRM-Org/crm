import 'reflect-metadata';

jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

const loadClient = async (): Promise<{
  Sentry: typeof import('@sentry/react');
  sentryClient: typeof import('@/services/observability/sentry-client').default;
}> => ({
  Sentry: await import('@sentry/react'),
  sentryClient: (await import('@/services/observability/sentry-client')).default,
});

const optionsFrom = (Sentry: typeof import('@sentry/react')): Record<string, unknown> =>
  (Sentry.init as jest.Mock).mock.calls[0][0];

describe('sentry config (integration)', () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.REACT_APP_SENTRY_DSN;
    delete process.env.REACT_APP_SENTRY_ENVIRONMENT;
    delete process.env.REACT_APP_RELEASE;
  });

  afterEach(() => {
    delete process.env.REACT_APP_SENTRY_DSN;
    delete process.env.REACT_APP_SENTRY_ENVIRONMENT;
    delete process.env.REACT_APP_RELEASE;
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  });

  it('does not build init options or load the SDK when the DSN is absent', async () => {
    const { Sentry, sentryClient } = await loadClient();

    await sentryClient.init();

    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('builds trimmed, guarded init options from the environment with a DSN', async () => {
    process.env.REACT_APP_SENTRY_DSN = '  https://key@sentry.io/1  ';
    process.env.REACT_APP_SENTRY_ENVIRONMENT = 'production';
    process.env.REACT_APP_RELEASE = 'v9';
    const { Sentry, sentryClient } = await loadClient();

    await sentryClient.init();

    expect(optionsFrom(Sentry)).toEqual({
      dsn: 'https://key@sentry.io/1',
      environment: 'production',
      release: 'v9',
      tracesSampleRate: 0,
      sendDefaultPii: false,
      beforeSend: expect.any(Function),
    });
  });

  it('omits the release and falls back to NODE_ENV when neither is explicitly set', async () => {
    process.env.REACT_APP_SENTRY_DSN = 'https://key@sentry.io/1';
    process.env.NODE_ENV = 'staging';
    const { Sentry, sentryClient } = await loadClient();

    await sentryClient.init();

    const options = optionsFrom(Sentry);
    expect(options.environment).toBe('staging');
    expect(options.release).toBeUndefined();
  });

  it('falls back to development when the environment is blank and no NODE_ENV is set', async () => {
    process.env.REACT_APP_SENTRY_DSN = 'https://key@sentry.io/1';
    process.env.REACT_APP_SENTRY_ENVIRONMENT = '   ';
    delete process.env.NODE_ENV;
    const { Sentry, sentryClient } = await loadClient();

    await sentryClient.init();

    expect(optionsFrom(Sentry).environment).toBe('development');
  });

  it('exposes the config as a shared singleton', async () => {
    const { SentryConfig } = await import('@/services/observability/sentry-config');
    const sentryConfig = (await import('@/services/observability/sentry-config')).default;

    expect(sentryConfig).toBeInstanceOf(SentryConfig);
  });
});
