import 'reflect-metadata';

import { container } from 'tsyringe';

describe('DI container — ErrorReporter token', () => {
  afterEach(() => {
    container.clearInstances();
  });

  it('ERROR_REPORTING_TOKENS.ErrorReporter resolves to a NoopErrorReporter instance', async () => {
    const [ERROR_REPORTING_TOKENS, { NoopErrorReporter }] = await Promise.all([
      import('@/services/error-reporting/tokens').then((m) => m.default),
      import('@/services/error-reporting'),
    ]);

    await import('@/config/dependency-injection-config');

    const reporter = container.resolve(ERROR_REPORTING_TOKENS.ErrorReporter);
    expect(reporter).toBeInstanceOf(NoopErrorReporter);
  });
});
