import { renderHook, waitFor } from '@testing-library/react';

import useAsyncList from '@/hooks/use-async-list';

describe('useAsyncList', () => {
  it('starts in the loading state before the loader settles', () => {
    const { result } = renderHook(() => useAsyncList(() => new Promise<string[]>(() => {})));

    expect(result.current).toEqual({ items: [], isLoading: true, hasError: false });
  });

  it('exposes the resolved items once the loader settles', async () => {
    const items = ['alpha', 'beta'];

    const { result } = renderHook(() => useAsyncList(() => Promise.resolve(items)));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual(items);
    expect(result.current.hasError).toBe(false);
  });

  it('flags an error and keeps the list empty when the loader rejects', async () => {
    const { result } = renderHook(() =>
      useAsyncList(() => Promise.reject(new Error('unavailable')))
    );

    await waitFor(() => expect(result.current.hasError).toBe(true));
    expect(result.current.items).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('runs the loader once even when the caller passes a new function each render', async () => {
    const load = jest.fn().mockResolvedValue([]);

    const { result, rerender } = renderHook(() => useAsyncList(() => load()));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    rerender();
    rerender();

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not set state after unmount when the loader settles late', async () => {
    let settle: (items: string[]) => void = () => {};
    const pending = new Promise<string[]>((resolve) => {
      settle = resolve;
    });

    const { result, unmount } = renderHook(() => useAsyncList(() => pending));
    unmount();
    settle(['late']);
    await pending;

    expect(result.current).toEqual({ items: [], isLoading: true, hasError: false });
  });

  it('does not flag an error after unmount when the loader rejects late', async () => {
    let fail: (error: Error) => void = () => {};
    const pending = new Promise<string[]>((_, reject) => {
      fail = reject;
    });

    const { result, unmount } = renderHook(() => useAsyncList(() => pending));
    unmount();
    fail(new Error('too late'));
    await pending.catch(() => undefined);

    expect(result.current.hasError).toBe(false);
  });
});
