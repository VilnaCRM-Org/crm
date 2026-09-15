export type RecoveryStrategy = 'retry' | 'reset' | 'reload' | 'navigate-home' | 'none';

export type ErrorSeverity = 'warning' | 'error' | 'fatal';

export interface RecoverableError {
  readonly recoverable: boolean;
  readonly strategy: RecoveryStrategy;
  readonly messageKey: string;
  readonly severity: ErrorSeverity;
  readonly cause?: unknown;
}
