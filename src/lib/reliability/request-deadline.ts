// One request's abort scope: the caller's signal and a timer race into a single AbortSignal,
// and `timedOut` records which of them fired. A caller abort stops the timer so the deadline can
// never be reported as expired afterwards; `release()` stops only the timer — the caller
// listener stays attached so an abort that arrives while a body is still being read cancels
// that read too (issue #147).
export default class RequestDeadline {
  private readonly controller = new AbortController();

  private readonly timer: ReturnType<typeof setTimeout> | undefined;

  private expired = false;

  constructor(callerSignal: AbortSignal | undefined, timeoutMs: number) {
    this.forwardCallerAbort(callerSignal);
    this.timer = this.controller.signal.aborted
      ? undefined
      : setTimeout(() => this.expire(), timeoutMs);
  }

  public get signal(): AbortSignal {
    return this.controller.signal;
  }

  public get timedOut(): boolean {
    return this.expired;
  }

  public release(): void {
    clearTimeout(this.timer);
  }

  private forwardCallerAbort(callerSignal: AbortSignal | undefined): void {
    if (!callerSignal) return;
    if (callerSignal.aborted) {
      this.controller.abort();
      return;
    }
    callerSignal.addEventListener('abort', () => this.cancel());
  }

  private cancel(): void {
    clearTimeout(this.timer);
    this.controller.abort();
  }

  private expire(): void {
    this.expired = true;
    this.controller.abort();
  }
}
