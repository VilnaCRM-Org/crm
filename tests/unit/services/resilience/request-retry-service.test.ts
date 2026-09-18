import RequestRetryService from '@/services/resilience/request-retry-service';
import type { RetryAttempt } from '@/services/types/resilience/request-retry';
import { buildToken } from '@tests/builders';

const transient = (): Error => Object.assign(new Error('unavailable'), { status: 503 });
const permanent = (): Error => Object.assign(new Error('bad request'), { status: 400 });

const createService = (
  delays: number[] = [100, 200, 400]
): { service: RequestRetryService; delayMs: jest.Mock } => {
  const delayMs = jest.fn((attempt: number) => delays[attempt - 1] ?? 0);
  const transientErrors = {
    is: (error: unknown): boolean =>
      (error as { status?: unknown }).status === 503 ||
      (error as { status?: unknown }).status === 0,
  };
  return {
    service: new RequestRetryService({ delayMs } as never, transientErrors as never),
    delayMs,
  };
};

const settle = async (promise: Promise<unknown>): Promise<unknown> =>
  promise.then(
    (value) => value,
    (error: unknown) => error
  );

describe('RequestRetryService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves with the first successful result and hands attempt 1 the whole budget', async () => {
    const { service } = createService();
    const value = buildToken();
    const operation = jest.fn(async () => value);

    await expect(service.execute(operation, { budgetMs: 5_000 })).resolves.toBe(value);

    expect(operation).toHaveBeenCalledTimes(1);
    expect(operation).toHaveBeenCalledWith({ attempt: 1, remainingMs: 5_000 });
  });

  it('retries a transient failure after the backoff delay and numbers each attempt', async () => {
    const { service, delayMs } = createService([100, 200]);
    const value = buildToken();
    const operation = jest
      .fn<Promise<string>, [RetryAttempt]>()
      .mockRejectedValueOnce(transient())
      .mockRejectedValueOnce(transient())
      .mockResolvedValueOnce(value);

    const result = service.execute(operation, { budgetMs: 5_000 });
    await jest.advanceTimersByTimeAsync(0);
    expect(operation).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(99);
    expect(operation).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(operation).toHaveBeenCalledTimes(2);
    expect(operation).toHaveBeenLastCalledWith({ attempt: 2, remainingMs: 4_900 });

    await jest.advanceTimersByTimeAsync(200);
    expect(operation).toHaveBeenCalledTimes(3);
    expect(operation).toHaveBeenLastCalledWith({ attempt: 3, remainingMs: 4_700 });

    await expect(result).resolves.toBe(value);
    expect(delayMs.mock.calls).toEqual([[1], [2]]);
  });

  it('gives up after three attempts and rethrows the last transient error', async () => {
    const { service } = createService([10, 10, 10]);
    const last = transient();
    const operation = jest
      .fn<Promise<string>, [RetryAttempt]>()
      .mockRejectedValueOnce(transient())
      .mockRejectedValueOnce(transient())
      .mockRejectedValueOnce(last)
      .mockResolvedValue(buildToken());

    const outcome = settle(service.execute(operation, { budgetMs: 5_000 }));
    await jest.advanceTimersByTimeAsync(1_000);

    expect(await outcome).toBe(last);
    expect(operation).toHaveBeenCalledTimes(3);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('does not retry a failure the detector does not classify as transient', async () => {
    const { service, delayMs } = createService();
    const error = permanent();
    const operation = jest.fn().mockRejectedValue(error);

    await expect(service.execute(operation, { budgetMs: 5_000 })).rejects.toBe(error);

    expect(operation).toHaveBeenCalledTimes(1);
    expect(delayMs).not.toHaveBeenCalled();
  });

  it('stops when the wait would leave under 250 ms of budget for the next attempt', async () => {
    const { service } = createService([300]);
    const error = transient();
    const operation = jest.fn(async () => {
      jest.advanceTimersByTime(600);
      throw error;
    });

    await expect(service.execute(operation, { budgetMs: 1_000 })).rejects.toBe(error);

    expect(operation).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('still retries when exactly 250 ms of budget would remain after the wait', async () => {
    const { service } = createService([300]);
    const operation = jest
      .fn<Promise<string>, [RetryAttempt]>()
      .mockImplementationOnce(async () => {
        jest.advanceTimersByTime(450);
        throw transient();
      })
      .mockResolvedValueOnce('ok');

    const result = service.execute(operation, { budgetMs: 1_000 });
    await jest.advanceTimersByTimeAsync(300);

    await expect(result).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
    expect(operation).toHaveBeenLastCalledWith({ attempt: 2, remainingMs: 250 });
  });

  it('rejects with an AbortError when the caller aborts during the backoff wait', async () => {
    const { service } = createService([500]);
    const controller = new AbortController();
    const operation = jest.fn().mockRejectedValue(transient());

    const outcome = settle(
      service.execute(operation, { budgetMs: 5_000, signal: controller.signal })
    );
    await jest.advanceTimersByTimeAsync(100);
    expect(jest.getTimerCount()).toBe(1);
    controller.abort();
    expect(jest.getTimerCount()).toBe(0);

    expect(await outcome).toMatchObject({ name: 'AbortError' });
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('rejects with an AbortError instead of waiting when the signal is aborted', async () => {
    const { service, delayMs } = createService([500]);
    const controller = new AbortController();
    const operation = jest.fn(async () => {
      controller.abort();
      throw transient();
    });

    await expect(
      service.execute(operation, { budgetMs: 5_000, signal: controller.signal })
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(operation).toHaveBeenCalledTimes(1);
    expect(delayMs).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('reports the abort with an Error whose message names the retry wait', async () => {
    const { service } = createService([500]);
    const controller = new AbortController();
    controller.abort();
    const operation = jest.fn().mockRejectedValue(transient());

    const error = await settle(
      service.execute(operation, { budgetMs: 5_000, signal: controller.signal })
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('The request was aborted while waiting to retry');
  });

  it('retries a transport failure reported with status 0', async () => {
    const { service } = createService([10]);
    const operation = jest
      .fn<Promise<string>, [RetryAttempt]>()
      .mockRejectedValueOnce(Object.assign(new Error('Network error'), { status: 0 }))
      .mockResolvedValueOnce('ok');

    const result = service.execute(operation, { budgetMs: 5_000 });
    await jest.advanceTimersByTimeAsync(10);

    await expect(result).resolves.toBe('ok');
  });
});
