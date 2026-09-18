import RequestDeadline from '@/lib/reliability/request-deadline';
import RequestDeadlineFactory from '@/lib/reliability/request-deadline-factory';

describe('RequestDeadlineFactory', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('falls back to a 10 s default timeout when none is configured', () => {
    expect(new RequestDeadlineFactory().defaultTimeoutMs()).toBe(10_000);
    expect(new RequestDeadlineFactory(undefined).defaultTimeoutMs()).toBe(10_000);
  });

  it('reports the configured default timeout', () => {
    expect(new RequestDeadlineFactory(2_500).defaultTimeoutMs()).toBe(2_500);
  });

  it('creates a deadline bound to the caller signal and the requested window', () => {
    const controller = new AbortController();
    const deadline = new RequestDeadlineFactory(2_500).create(controller.signal, 40);

    expect(deadline).toBeInstanceOf(RequestDeadline);
    jest.advanceTimersByTime(39);
    expect(deadline.signal.aborted).toBe(false);
    jest.advanceTimersByTime(1);
    expect(deadline.timedOut).toBe(true);
  });

  it('creates a deadline that follows the caller abort when one is given', () => {
    const controller = new AbortController();
    const deadline = new RequestDeadlineFactory().create(controller.signal, 40);

    controller.abort();

    expect(deadline.signal.aborted).toBe(true);
    expect(deadline.timedOut).toBe(false);
  });
});
