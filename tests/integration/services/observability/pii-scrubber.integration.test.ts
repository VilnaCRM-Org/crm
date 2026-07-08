import 'reflect-metadata';

import type { SentryEvent } from '@/services/types/observability/sentry';

jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

const beforeSendOf = async (): Promise<(event: SentryEvent) => SentryEvent> => {
  process.env.REACT_APP_SENTRY_DSN = 'https://key@sentry.io/1';
  const Sentry = await import('@sentry/react');
  const sentryClient = (await import('@/services/observability/sentry-client')).default;
  await sentryClient.init();
  return (Sentry.init as jest.Mock).mock.calls[0][0].beforeSend;
};

describe('pii scrubber (integration)', () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.REACT_APP_SENTRY_DSN;
  });

  afterEach(() => {
    delete process.env.REACT_APP_SENTRY_DSN;
  });

  it('scrubs sensitive keys, key names, patterns, and arrays via beforeSend', async () => {
    const beforeSend = await beforeSendOf();

    const scrubbed = beforeSend({
      message: 'login failed for alice@example.com',
      extra: {
        access_token: 'a',
        clientSecret: 'b',
        emailAddress: 'c',
        route: '/sign-in',
        count: 5,
        nothing: null,
        list: ['plain', 'bob@corp.io'],
        'carol@corp.io': 'value',
        auth: { Cookie: 'x', keep: 'ok' },
      },
      breadcrumbs: [{ message: 'issued eyJhbGciOi.JeyJzdWIi.Qsdfx via Bearer abc.def-ghi' }],
    });

    expect(scrubbed).toEqual({
      message: 'login failed for [redacted]',
      extra: {
        route: '/sign-in',
        count: 5,
        nothing: null,
        list: ['plain', '[redacted]'],
        '[redacted]': 'value',
        auth: { keep: 'ok' },
      },
      breadcrumbs: [{ message: 'issued [redacted] via [redacted]' }],
    });
  });

  it('exposes the scrubber as a shared singleton', async () => {
    const { PiiScrubber } = await import('@/services/observability/pii-scrubber');
    const piiScrubber = (await import('@/services/observability/pii-scrubber')).default;

    expect(piiScrubber).toBeInstanceOf(PiiScrubber);
  });
});
