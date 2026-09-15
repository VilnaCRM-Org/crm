import type { ErrorSeverity, RecoverableError, RecoveryStrategy } from './types/recoverable-error';

const STRATEGIES: readonly RecoveryStrategy[] = [
  'retry',
  'reset',
  'reload',
  'navigate-home',
  'none',
];

const SEVERITIES: readonly ErrorSeverity[] = ['warning', 'error', 'fatal'];

export class RecoverableErrorGuard {
  public is(value: unknown): value is RecoverableError {
    if (typeof value !== 'object' || value === null) return false;
    const candidate = value as Record<string, unknown>;

    return (
      typeof candidate.recoverable === 'boolean' &&
      (STRATEGIES as readonly unknown[]).includes(candidate.strategy) &&
      this.isMessageKey(candidate.messageKey) &&
      (SEVERITIES as readonly unknown[]).includes(candidate.severity)
    );
  }

  private isMessageKey(value: unknown): boolean {
    return typeof value === 'string' && value.length > 0;
  }
}

const recoverableErrorGuard = new RecoverableErrorGuard();

export default recoverableErrorGuard;
