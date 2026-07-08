import correlationIdProvider from '@/services/observability/correlation-id-provider';
import { ObservabilityCore } from '@/services/observability/observability-core';
import sentryClient from '@/services/observability/sentry-client';
import sentryConfig from '@/services/observability/sentry-config';
import webVitalsReporter from '@/services/observability/web-vitals-reporter';

jest.mock('@/services/observability/sentry-client', () => ({
  __esModule: true,
  default: {
    init: jest.fn((): Promise<void> => Promise.resolve()),
    captureException: jest.fn(),
    setUser: jest.fn(),
    clearUser: jest.fn(),
    addBreadcrumb: jest.fn(),
  },
}));
jest.mock('@/services/observability/web-vitals-reporter', () => ({
  __esModule: true,
  default: { subscribe: jest.fn((): Promise<void> => Promise.resolve()) },
}));
jest.mock('@/services/observability/sentry-config', () => ({
  __esModule: true,
  default: { isEnabled: jest.fn() },
}));
jest.mock('@/services/observability/correlation-id-provider', () => ({
  __esModule: true,
  default: { header: 'X-Request-Id', currentId: '' },
}));

const isEnabled = sentryConfig.isEnabled as jest.Mock;

describe('ObservabilityCore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isEnabled.mockReturnValue(false);
    correlationIdProvider.currentId = '';
  });

  it('does not start telemetry when the DSN is disabled', () => {
    new ObservabilityCore().init();

    expect(sentryClient.init).not.toHaveBeenCalled();
    expect(webVitalsReporter.subscribe).not.toHaveBeenCalled();
  });

  it('starts telemetry once and forwards web vitals to breadcrumbs', () => {
    isEnabled.mockReturnValue(true);
    (webVitalsReporter.subscribe as jest.Mock).mockImplementation(
      (handler: (metric: unknown) => void): Promise<void> => {
        handler({ name: 'LCP', value: 12, id: 'v1' });
        return Promise.resolve();
      }
    );
    const core = new ObservabilityCore();

    core.init();
    core.init();

    expect(sentryClient.init).toHaveBeenCalledTimes(1);
    expect(sentryClient.addBreadcrumb).toHaveBeenCalledWith({
      category: 'web-vitals',
      message: 'LCP',
      data: { value: 12, id: 'v1' },
    });
  });

  it('swallows asynchronous startup failures', async () => {
    isEnabled.mockReturnValue(true);
    (sentryClient.init as jest.Mock).mockRejectedValue(new Error('init failed'));
    (webVitalsReporter.subscribe as jest.Mock).mockRejectedValue(new Error('subscribe failed'));

    expect(() => new ObservabilityCore().init()).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    expect(sentryClient.init).toHaveBeenCalledTimes(1);
  });

  it('captures errors and attaches the active correlation id', () => {
    correlationIdProvider.currentId = 'req-9';
    const error = new Error('failed');

    new ObservabilityCore().captureError(error, { source: 'test' });

    expect(sentryClient.captureException).toHaveBeenCalledWith(error, {
      source: 'test',
      'X-Request-Id': 'req-9',
    });
  });

  it('prefers a correlation id already present in the capture context', () => {
    correlationIdProvider.currentId = 'global-id';
    const error = new Error('failed');

    new ObservabilityCore().captureError(error, { 'X-Request-Id': 'op-id', source: 'apollo' });

    expect(sentryClient.captureException).toHaveBeenCalledWith(error, {
      'X-Request-Id': 'op-id',
      source: 'apollo',
    });
  });

  it('retries startup after a failed Sentry SDK initialization', async () => {
    isEnabled.mockReturnValue(true);
    (sentryClient.init as jest.Mock).mockRejectedValueOnce(new Error('init failed'));
    const core = new ObservabilityCore();

    core.init();
    await Promise.resolve();
    await Promise.resolve();
    core.init();

    expect(sentryClient.init).toHaveBeenCalledTimes(2);
    expect(webVitalsReporter.subscribe).toHaveBeenCalledTimes(1);
  });

  it('captures errors without a correlation id when none is active', () => {
    const error = new Error('failed');

    new ObservabilityCore().captureError(error);

    expect(sentryClient.captureException).toHaveBeenCalledWith(error, undefined);
  });

  it('forwards ErrorReporter reports to captureError', () => {
    const error = new Error('reported');

    new ObservabilityCore().report(error, { surface: 'app' });

    expect(sentryClient.captureException).toHaveBeenCalledWith(error, { surface: 'app' });
  });

  it('sets and clears identity', () => {
    const core = new ObservabilityCore();

    core.setUser({ id: 'opaque', sessionId: 's1' });
    core.clearUser();

    expect(sentryClient.setUser).toHaveBeenCalledWith({ id: 'opaque', sessionId: 's1' });
    expect(sentryClient.clearUser).toHaveBeenCalledTimes(1);
  });

  it('reports web vitals as breadcrumbs', () => {
    new ObservabilityCore().reportVital({ name: 'INP', value: 40, id: 'v2' });

    expect(sentryClient.addBreadcrumb).toHaveBeenCalledWith({
      category: 'web-vitals',
      message: 'INP',
      data: { value: 40, id: 'v2' },
    });
  });

  it('never lets a telemetry failure escape to the caller', () => {
    (sentryClient.captureException as jest.Mock).mockImplementation(() => {
      throw new Error('sentry down');
    });

    expect(() => new ObservabilityCore().captureError(new Error('x'))).not.toThrow();
  });
});
