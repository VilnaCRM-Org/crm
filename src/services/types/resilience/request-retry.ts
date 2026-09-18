export interface RetryAttempt {
  /** 1-based ordinal of this attempt. */
  readonly attempt: number;
  /** Wall-clock budget left for this attempt, in milliseconds. */
  readonly remainingMs: number;
}

export type RetryOperation<T> = (attempt: RetryAttempt) => Promise<T>;

export interface RetryOptions {
  /** Total wall-clock budget across every attempt and every backoff wait. */
  readonly budgetMs: number;
  /** The caller's abort: stops the loop between attempts and during a backoff wait. */
  readonly signal?: AbortSignal;
}

export interface RetryRun {
  readonly attempt: number;
  readonly deadlineAt: number;
  readonly options: RetryOptions;
}
