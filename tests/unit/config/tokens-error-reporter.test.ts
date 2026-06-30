import 'reflect-metadata';

import { container } from 'tsyringe';

describe('DI container — ErrorReporter token', () => {
  afterEach(() => {
    container.clearInstances();
  });

  it('TOKENS.ErrorReporter resolves to a NoopErrorReporter instance', async () => {
    const [TOKENS, { NoopErrorReporter }] = await Promise.all([
      import('@/config/tokens').then((m) => m.default),
      import('@/services/error-reporting'),
    ]);

    await import('@/config/dependency-injection-config');

    const reporter = container.resolve(TOKENS.ErrorReporter);
    expect(reporter).toBeInstanceOf(NoopErrorReporter);
  });
});
