import type { SentryApi, WebVitalsModule } from '@/services/types/observability/sentry';

type Members<T> = ReadonlyArray<keyof T & string>;

const SENTRY_MEMBERS: Members<SentryApi> = [
  'init',
  'captureException',
  'setUser',
  'setTag',
  'addBreadcrumb',
];

const WEB_VITALS_MEMBERS: Members<WebVitalsModule> = ['onLCP', 'onINP', 'onCLS', 'onFCP', 'onTTFB'];

describe('vendor SDK conformance', () => {
  it.each(SENTRY_MEMBERS)('@sentry/react exports %s as a function', async (member) => {
    const sdk = await import('@sentry/react');

    expect(typeof (sdk as unknown as Record<string, unknown>)[member]).toBe('function');
  });

  it.each(WEB_VITALS_MEMBERS)('web-vitals exports %s as a function', async (member) => {
    const module = await import('web-vitals');

    expect(typeof (module as unknown as Record<string, unknown>)[member]).toBe('function');
  });
});
