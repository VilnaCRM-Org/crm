import * as barrel from '@/services/error-reporting';

describe('error-reporting barrel', () => {
  it('exports NoopErrorReporter class', () => {
    expect(typeof barrel.NoopErrorReporter).toBe('function');
  });

  it('exports noopErrorReporter singleton', () => {
    expect(barrel.noopErrorReporter).toBeInstanceOf(barrel.NoopErrorReporter);
  });
});
