import { injectable } from 'tsyringe';

const BASE_DELAY_MS = 250;

const MAX_DELAY_MS = 2_000;

// Equal jitter: the delay grows exponentially with the attempt, capped, and the upper half of
// the window is randomised so retries from many clients do not land on the backend in step.
@injectable()
export default class ExponentialBackoffStrategy {
  public delayMs(attempt: number): number {
    const cap = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** (attempt - 1));
    const half = cap / 2;
    return Math.round(half + Math.random() * half);
  }
}
