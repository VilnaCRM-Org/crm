import 'reflect-metadata';

jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

const vitalHandlers: Array<(metric: unknown) => void> = [];
jest.mock('web-vitals', () => {
  const register = (handler: (metric: unknown) => void): void => {
    vitalHandlers.push(handler);
  };
  return { onLCP: register, onINP: register, onCLS: register, onFCP: register, onTTFB: register };
});

const flushMicrotasks = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('web-vitals reporter (integration)', () => {
  beforeEach(() => {
    jest.resetModules();
    vitalHandlers.length = 0;
    process.env.REACT_APP_SENTRY_DSN = 'https://key@sentry.io/1';
  });

  afterEach(() => {
    delete process.env.REACT_APP_SENTRY_DSN;
  });

  it('subscribes every web-vital signal and forwards a metric as a Sentry breadcrumb', async () => {
    const Sentry = await import('@sentry/react');
    const observabilityCore = (await import('@/services/observability/observability-core')).default;

    observabilityCore.init();
    await flushMicrotasks();

    expect(vitalHandlers).toHaveLength(5);

    vitalHandlers[0]?.({ name: 'LCP', value: 2.5, id: 'v1' });

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: 'web-vitals',
      message: 'LCP',
      data: { value: 2.5, id: 'v1' },
    });
  });

  it('exposes the reporter as a shared singleton', async () => {
    const mod = await import('@/services/observability/web-vitals-reporter');

    expect(mod.default).toBeInstanceOf(mod.WebVitalsReporter);
  });
});
