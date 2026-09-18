import { inject, injectable } from 'tsyringe';

import type {
  RetryOperation,
  RetryOptions,
  RetryRun,
} from '@/services/types/resilience/request-retry';

import type ExponentialBackoffStrategy from './exponential-backoff-strategy';
import RESILIENCE_TOKENS from './tokens';
import type TransientErrorDetector from './transient-error-detector';

const MAX_ATTEMPTS = 3;

// An attempt that would start with less than this left could not complete a round trip, so the
// loop gives up instead of spending the last of the budget on a request it will abort itself.
const MIN_ATTEMPT_BUDGET_MS = 250;

@injectable()
export default class RequestRetryService {
  constructor(
    @inject(RESILIENCE_TOKENS.BackoffStrategy) private readonly backoff: ExponentialBackoffStrategy,
    @inject(RESILIENCE_TOKENS.TransientErrorDetector)
    private readonly transientErrors: TransientErrorDetector
  ) {}

  public execute<T>(operation: RetryOperation<T>, options: RetryOptions): Promise<T> {
    const deadlineAt = Date.now() + options.budgetMs;
    return this.attempt(operation, { attempt: 1, deadlineAt, options });
  }

  // Recursive rather than a loop: every attempt awaits, and `no-await-in-loop` is an error here.
  private async attempt<T>(operation: RetryOperation<T>, run: RetryRun): Promise<T> {
    try {
      return await operation({ attempt: run.attempt, remainingMs: run.deadlineAt - Date.now() });
    } catch (error) {
      const delayMs = this.retryDelayMs(error, run);
      if (delayMs === undefined) throw error;
      await this.wait(delayMs, run.options.signal);
      return this.attempt(operation, { ...run, attempt: run.attempt + 1 });
    }
  }

  private retryDelayMs(error: unknown, run: RetryRun): number | undefined {
    if (run.attempt >= MAX_ATTEMPTS || !this.transientErrors.is(error)) return undefined;
    const delayMs = this.backoff.delayMs(run.attempt);
    const remainingAfterWait = run.deadlineAt - Date.now() - delayMs;

    return remainingAfterWait < MIN_ATTEMPT_BUDGET_MS ? undefined : delayMs;
  }

  // The caller's abort wins over the backoff: an already-aborted signal rejects at once, and an
  // abort that lands mid-wait cancels the timer, so an unmounted form never fires a retry.
  private wait(delayMs: number, signal: AbortSignal | undefined): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(this.abortError());
        return;
      }
      const timer = setTimeout(resolve, delayMs);
      signal?.addEventListener('abort', () => this.cancelWait(timer, reject));
    });
  }

  private cancelWait(timer: ReturnType<typeof setTimeout>, reject: (error: Error) => void): void {
    clearTimeout(timer);
    reject(this.abortError());
  }

  private abortError(): Error {
    const error = new Error('The request was aborted while waiting to retry');
    error.name = 'AbortError';
    return error;
  }
}
