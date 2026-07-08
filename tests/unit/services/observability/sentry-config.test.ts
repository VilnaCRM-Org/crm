import sentryConfig, { SentryConfig } from '@/services/observability/sentry-config';

describe('SentryConfig', () => {
  const config = new SentryConfig();

  afterEach(() => {
    delete process.env.REACT_APP_SENTRY_DSN;
    delete process.env.REACT_APP_SENTRY_ENVIRONMENT;
    delete process.env.REACT_APP_RELEASE;
  });

  it('trims the configured DSN', () => {
    process.env.REACT_APP_SENTRY_DSN = '  https://key@sentry.io/1  ';

    expect(config.dsn()).toBe('https://key@sentry.io/1');
  });

  it('is disabled when the DSN is missing or whitespace', () => {
    expect(config.isEnabled()).toBe(false);

    process.env.REACT_APP_SENTRY_DSN = '   ';

    expect(config.isEnabled()).toBe(false);
  });

  it('is enabled when a DSN is present', () => {
    process.env.REACT_APP_SENTRY_DSN = 'https://key@sentry.io/1';

    expect(config.isEnabled()).toBe(true);
  });

  it('prefers the explicit environment tag', () => {
    process.env.REACT_APP_SENTRY_ENVIRONMENT = 'staging';

    expect(config.environment()).toBe('staging');
  });

  it('falls back to NODE_ENV when no explicit environment is set', () => {
    expect(config.environment()).toBe(process.env.NODE_ENV);
  });

  it('falls back to development when neither environment nor NODE_ENV is set', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    delete process.env.NODE_ENV;

    expect(config.environment()).toBe('development');

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('returns the release when set and undefined when empty', () => {
    expect(config.release()).toBeUndefined();

    process.env.REACT_APP_RELEASE = 'v1.2.3';

    expect(config.release()).toBe('v1.2.3');
  });

  it('returns no options when disabled', () => {
    expect(config.buildOptions(() => null)).toBeUndefined();
  });

  it('builds guarded init options when enabled', () => {
    process.env.REACT_APP_SENTRY_DSN = 'https://key@sentry.io/1';
    process.env.REACT_APP_SENTRY_ENVIRONMENT = 'production';
    process.env.REACT_APP_RELEASE = 'v9';
    const beforeSend = jest.fn();

    const options = config.buildOptions(beforeSend);

    expect(options).toEqual({
      dsn: 'https://key@sentry.io/1',
      environment: 'production',
      release: 'v9',
      tracesSampleRate: 0,
      sendDefaultPii: false,
      beforeSend,
    });
  });

  it('exports a shared singleton instance', () => {
    expect(sentryConfig).toBeInstanceOf(SentryConfig);
  });
});
