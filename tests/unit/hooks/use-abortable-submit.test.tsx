import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, type JSX } from 'react';

import useAbortableSubmit from '@/hooks/use-abortable-submit';

interface Deferred {
  readonly promise: Promise<string>;
  readonly resolve: (value: string) => void;
}

const deferred = (): Deferred => {
  let resolve: (value: string) => void = () => undefined;
  const promise = new Promise<string>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

describe('useAbortableSubmit', () => {
  it('starts idle before any submit', () => {
    const run = jest.fn(async () => 'never');
    const { result } = renderHook(() => useAbortableSubmit(run));

    expect(result.current.isSubmitting).toBe(false);
  });

  it('submits through the run of the latest render', async () => {
    const first = jest.fn(async (input: string) => `first:${input}`);
    const latest = jest.fn(async (input: string) => `latest:${input}`);
    const { result, rerender } = renderHook(({ run }) => useAbortableSubmit(run), {
      initialProps: { run: first },
    });

    rerender({ run: latest });

    await act(async () => {
      await expect(result.current.submit('input')).resolves.toBe('latest:input');
    });
    expect(first).not.toHaveBeenCalled();
  });

  it('runs with the input and a fresh signal and tracks isSubmitting', async () => {
    const pending = deferred();
    const run = jest.fn<Promise<string>, [string, AbortSignal]>(() => pending.promise);
    const { result } = renderHook(() => useAbortableSubmit(run));

    let settled: Promise<string | null> = Promise.resolve(null);
    act(() => {
      settled = result.current.submit('input');
    });

    expect(result.current.isSubmitting).toBe(true);
    expect(run).toHaveBeenCalledWith('input', expect.any(AbortSignal));
    expect(run.mock.calls[0]?.[1].aborted).toBe(false);
    await act(async () => {
      pending.resolve('outcome');
      await expect(settled).resolves.toBe('outcome');
    });
    expect(result.current.isSubmitting).toBe(false);
  });

  it('refuses a second submit while one is pending', async () => {
    const pending = deferred();
    const run = jest.fn(() => pending.promise);
    const { result } = renderHook(() => useAbortableSubmit(run));

    let second: Promise<string | null> = Promise.resolve('unset');
    act(() => {
      void result.current.submit('first');
      second = result.current.submit('second');
    });

    await expect(second).resolves.toBeNull();
    expect(run).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve('done'));
  });

  it('accepts a new submit once the previous one settled, with a fresh signal', async () => {
    const run = jest.fn<Promise<string>, [string, AbortSignal]>(async (input) => input);
    const { result } = renderHook(() => useAbortableSubmit(run));

    await act(async () => {
      await result.current.submit('first');
    });
    await act(async () => {
      await expect(result.current.submit('second')).resolves.toBe('second');
    });

    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls[1]?.[1]).not.toBe(run.mock.calls[0]?.[1]);
  });

  it('aborts the pending run on unmount and resolves it null', async () => {
    const pending = deferred();
    const run = jest.fn<Promise<string>, [string, AbortSignal]>(() => pending.promise);
    const { result, unmount } = renderHook(() => useAbortableSubmit(run));

    let settled: Promise<string | null> = Promise.resolve('unset');
    act(() => {
      settled = result.current.submit('input');
    });
    unmount();
    pending.resolve('late');

    expect(run.mock.calls[0]?.[1].aborted).toBe(true);
    await expect(settled).resolves.toBeNull();
  });

  it('starts exactly one run when a StrictMode component submits after mounting', async () => {
    const run = jest.fn<Promise<string>, [string, AbortSignal]>(async () => 'outcome');

    function Submitter(): JSX.Element {
      const { submit } = useAbortableSubmit(run);
      return (
        <button type="button" onClick={() => void submit('input')}>
          Submit
        </button>
      );
    }

    render(
      <StrictMode>
        <Submitter />
      </StrictMode>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0]?.[1].aborted).toBe(false);
  });
});
