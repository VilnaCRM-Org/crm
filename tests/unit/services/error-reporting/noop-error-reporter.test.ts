import NoopErrorReporter, {
  noopErrorReporter,
} from '@/services/error-reporting/noop-error-reporter';
import type { ErrorReporter } from '@/services/types/error-reporting';

describe('NoopErrorReporter', () => {
  it('report() returns without throwing (no-op)', () => {
    const reporter: ErrorReporter = new NoopErrorReporter();
    expect(() => reporter.report(new Error('test'))).not.toThrow();
  });

  it('report() returns undefined (no side-effects)', () => {
    const reporter: ErrorReporter = new NoopErrorReporter();
    const result = reporter.report(new Error('test'));
    expect(result).toBeUndefined();
  });

  it('noopErrorReporter singleton is an instance of NoopErrorReporter', () => {
    expect(noopErrorReporter).toBeInstanceOf(NoopErrorReporter);
  });
});
