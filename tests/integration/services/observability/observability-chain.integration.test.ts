import 'reflect-metadata';

import type ObservabilityServiceInstance from '@/services/observability/observability-service';

jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

const mockVitalHandlers: Array<(metric: unknown) => void> = [];
let mockVitalsShouldFail = false;
jest.mock('web-vitals', () => {
  const register = (handler: (metric: unknown) => void): void => {
    if (mockVitalsShouldFail) throw new Error('vitals boom');
    mockVitalHandlers.push(handler);
  };
  return { onLCP: register, onINP: register, onCLS: register, onFCP: register, onTTFB: register };
});

const enableDsn = (): void => {
  process.env.REACT_APP_SENTRY_DSN = 'https://key@sentry.io/1';
};

const flushMicrotasks = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const settle = async (): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

const loadChain = async (): Promise<{
  Sentry: typeof import('@sentry/react');
  observabilityCore: typeof import('@/services/observability/observability-core').default;
  correlationIdProvider: typeof import('@/services/observability/correlation-id-provider').default;
}> => ({
  Sentry: await import('@sentry/react'),
  observabilityCore: (await import('@/services/observability/observability-core')).default,
  correlationIdProvider: (await import('@/services/observability/correlation-id-provider')).default,
});

describe('observability chain (integration)', () => {
  beforeEach(() => {
    jest.resetModules();
    mockVitalHandlers.length = 0;
    mockVitalsShouldFail = false;
    delete process.env.REACT_APP_SENTRY_DSN;
  });

  afterEach(() => {
    delete process.env.REACT_APP_SENTRY_DSN;
  });

  it('resolves ObservabilityService from DI and stays inert without a DSN', async () => {
    const container = (await import('@/config/dependency-injection-config')).default;
    const OBSERVABILITY_TOKENS = (await import('@/services/observability/tokens')).default;
    const Sentry = await import('@sentry/react');
    const service = container.resolve<ObservabilityServiceInstance>(
      OBSERVABILITY_TOKENS.ObservabilityService
    );

    service.init();
    service.captureError(new Error('x'), { source: 'unit' });
    service.report(new Error('y'));
    service.setUser({ id: 'opaque' });
    service.clearUser();
    service.reportVital({ name: 'CLS', value: 0.1, id: 'v' });

    expect(Sentry.init).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('initializes the real Sentry + web-vitals chain and scrubs PII in beforeSend', async () => {
    enableDsn();
    const { Sentry, observabilityCore } = await loadChain();

    observabilityCore.init();
    observabilityCore.init();
    await flushMicrotasks();

    expect(Sentry.init).toHaveBeenCalledTimes(1);
    expect(mockVitalHandlers).toHaveLength(5);

    const options = (Sentry.init as jest.Mock).mock.calls[0][0];
    expect(options.sendDefaultPii).toBe(false);
    expect(options.beforeSend({ message: 'user bob@corp.io', extra: { password: 'p' } })).toEqual({
      message: 'user [redacted]',
      extra: {},
    });

    mockVitalHandlers[0]?.({ name: 'LCP', value: 3, id: 'v1' });
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: 'web-vitals',
      message: 'LCP',
      data: { value: 3, id: 'v1' },
    });

    observabilityCore.setUser({ id: 'opaque', sessionId: 's1' });
    observabilityCore.clearUser();
    expect(Sentry.setUser).toHaveBeenNthCalledWith(1, { id: 'opaque', sessionId: 's1' });
    expect(Sentry.setUser).toHaveBeenNthCalledWith(2, null);
  });

  it('attaches the active correlation id and never throws when SDK capture fails', async () => {
    enableDsn();
    const { Sentry, observabilityCore, correlationIdProvider } = await loadChain();
    observabilityCore.init();
    await flushMicrotasks();
    const id = correlationIdProvider.next();

    observabilityCore.captureError(new Error('boom'), { source: 'apollo' });
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), {
      extra: { source: 'apollo', 'X-Request-Id': id },
    });

    (Sentry.captureException as jest.Mock).mockImplementation(() => {
      throw new Error('sentry down');
    });
    expect(() => observabilityCore.captureError(new Error('again'))).not.toThrow();
  });

  it('swallows a failing SDK initialization without breaking startup', async () => {
    enableDsn();
    const { Sentry, observabilityCore } = await loadChain();
    (Sentry.init as jest.Mock).mockImplementation(() => {
      throw new Error('init boom');
    });

    expect(() => observabilityCore.init()).not.toThrow();
    await flushMicrotasks();
  });

  it('prefers a correlation id supplied in the capture context over the global id', async () => {
    enableDsn();
    const { Sentry, observabilityCore, correlationIdProvider } = await loadChain();
    observabilityCore.init();
    await flushMicrotasks();
    correlationIdProvider.next();

    observabilityCore.captureError(new Error('boom'), {
      'X-Request-Id': 'op-42',
      source: 'apollo',
    });

    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), {
      extra: { 'X-Request-Id': 'op-42', source: 'apollo' },
    });
  });

  it('retries a failed startup without re-subscribing web-vitals', async () => {
    enableDsn();
    const { Sentry, observabilityCore } = await loadChain();
    (Sentry.init as jest.Mock).mockImplementationOnce(() => {
      throw new Error('init boom');
    });

    observabilityCore.init();
    await settle();
    observabilityCore.init();
    await settle();

    expect(mockVitalHandlers).toHaveLength(5);
  });

  it('resubscribes web-vitals after a transient subscription failure', async () => {
    enableDsn();
    mockVitalsShouldFail = true;
    const { observabilityCore } = await loadChain();

    observabilityCore.init();
    await settle();
    mockVitalsShouldFail = false;
    observabilityCore.init();
    await settle();

    expect(mockVitalHandlers).toHaveLength(5);
  });
});
