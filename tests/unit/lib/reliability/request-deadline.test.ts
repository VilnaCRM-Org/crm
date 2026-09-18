import RequestDeadline from '@/lib/reliability/request-deadline';

describe('RequestDeadline', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts live with an unaborted signal and no timeout recorded', () => {
    const deadline = new RequestDeadline(undefined, 1_000);

    expect(deadline.signal.aborted).toBe(false);
    expect(deadline.timedOut).toBe(false);
  });

  it('aborts its signal and records the timeout once the window elapses', () => {
    const deadline = new RequestDeadline(undefined, 1_000);

    jest.advanceTimersByTime(999);
    expect(deadline.signal.aborted).toBe(false);

    jest.advanceTimersByTime(1);
    expect(deadline.signal.aborted).toBe(true);
    expect(deadline.timedOut).toBe(true);
  });

  it('forwards a caller abort without recording a timeout', () => {
    const controller = new AbortController();
    const deadline = new RequestDeadline(controller.signal, 1_000);

    controller.abort();

    expect(deadline.signal.aborted).toBe(true);
    expect(deadline.timedOut).toBe(false);
  });

  it('is aborted at once, and never times out, when the caller signal is aborted', () => {
    const controller = new AbortController();
    controller.abort();

    const deadline = new RequestDeadline(controller.signal, 1_000);

    expect(deadline.signal.aborted).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
    jest.advanceTimersByTime(1_000);
    expect(deadline.timedOut).toBe(false);
  });

  it('release() stops the timer so a completed request is never marked timed out', () => {
    const deadline = new RequestDeadline(undefined, 1_000);

    deadline.release();
    jest.advanceTimersByTime(1_000);

    expect(jest.getTimerCount()).toBe(0);
    expect(deadline.signal.aborted).toBe(false);
    expect(deadline.timedOut).toBe(false);
  });

  it('release() keeps the caller abort attached so a later abort still cancels the signal', () => {
    const controller = new AbortController();
    const deadline = new RequestDeadline(controller.signal, 1_000);

    deadline.release();
    controller.abort();

    expect(deadline.signal.aborted).toBe(true);
    expect(deadline.timedOut).toBe(false);
  });

  it('keeps reporting the timeout after a release() that comes too late', () => {
    const deadline = new RequestDeadline(undefined, 1_000);

    jest.advanceTimersByTime(1_000);
    deadline.release();

    expect(deadline.timedOut).toBe(true);
    expect(deadline.signal.aborted).toBe(true);
  });

  it('exposes the same signal instance on every read', () => {
    const deadline = new RequestDeadline(undefined, 1_000);

    expect(deadline.signal).toBe(deadline.signal);
  });
});
