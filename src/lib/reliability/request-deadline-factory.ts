import RequestDeadline from './request-deadline';

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

export default class RequestDeadlineFactory {
  private readonly fallbackTimeoutMs: number;

  constructor(defaultTimeoutMs?: number) {
    this.fallbackTimeoutMs = defaultTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  }

  public defaultTimeoutMs(): number {
    return this.fallbackTimeoutMs;
  }

  public create(callerSignal: AbortSignal | undefined, timeoutMs: number): RequestDeadline {
    return new RequestDeadline(callerSignal, timeoutMs);
  }
}
