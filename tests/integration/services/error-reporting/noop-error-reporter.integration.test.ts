import '../../setup';

import NoopErrorReporter, {
  noopErrorReporter,
} from '@/services/error-reporting/noop-error-reporter';
import type { ErrorReporter } from '@/services/types/error-reporting';

describe('NoopErrorReporter (integration)', () => {
  it('report() is a no-op that accepts an error and optional context without throwing', () => {
    const reporter: ErrorReporter = new NoopErrorReporter();

    expect(reporter.report(new Error('boom'), { componentStack: 'x' })).toBeUndefined();
    expect(() => reporter.report(new Error('no-context'))).not.toThrow();
  });

  it('exposes a callable module singleton', () => {
    const reporter: ErrorReporter = noopErrorReporter;

    expect(noopErrorReporter).toBeInstanceOf(NoopErrorReporter);
    expect(() => reporter.report(new Error('singleton'))).not.toThrow();
  });
});
