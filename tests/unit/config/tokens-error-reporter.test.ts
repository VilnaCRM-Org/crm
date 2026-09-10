import 'reflect-metadata';

import { container } from 'tsyringe';

describe('DI container — ErrorReporter token', () => {
  // `clearInstances()` also drops `useValue` registrations, and the reporter now injects the
  // container-free observability core rather than value-importing it (issue #130), so clearing
  // between the two cases would unregister the very token the second one resolves through.
  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    container.clearInstances();
  });

  it('resolves a non-noop, observability-backed reporter in the production graph', async () => {
    const [ERROR_REPORTING_TOKENS, { NoopErrorReporter }, { default: ObservabilityErrorReporter }] =
      await Promise.all([
        import('@/services/error-reporting/tokens').then((m) => m.default),
        import('@/services/error-reporting'),
        import('@/services/error-reporting/observability-error-reporter'),
      ]);

    await import('@/config/dependency-injection-config');

    const reporter = container.resolve(ERROR_REPORTING_TOKENS.ErrorReporter);

    expect(reporter).not.toBeInstanceOf(NoopErrorReporter);
    expect(reporter).toBeInstanceOf(ObservabilityErrorReporter);
  });

  it('routes a reported error into the observability boundary', async () => {
    const [ERROR_REPORTING_TOKENS, observabilityCore] = await Promise.all([
      import('@/services/error-reporting/tokens').then((m) => m.default),
      import('@/services/observability/observability-core').then((m) => m.default),
    ]);

    await import('@/config/dependency-injection-config');

    const captureError = jest.spyOn(observabilityCore, 'captureError').mockImplementation();
    const error = new Error('boundary crash');

    container
      .resolve<{ report: (e: Error, c?: Record<string, unknown>) => void }>(
        ERROR_REPORTING_TOKENS.ErrorReporter
      )
      .report(error, { surface: 'app' });

    expect(captureError).toHaveBeenCalledWith(error, { surface: 'app' });
  });
});
