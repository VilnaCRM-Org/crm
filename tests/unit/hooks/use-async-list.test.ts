import { renderHook, waitFor } from '@testing-library/react';

import useAsyncList, { asyncListLoader } from '@/hooks/use-async-list';

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

  it('unmounts cleanly while a load is still in flight', async () => {
    let settle: (items: string[]) => void = () => {};
    const pending = new Promise<string[]>((resolve) => {
      settle = resolve;
    });

    const { unmount } = renderHook(() => useAsyncList(() => pending));
    unmount();
    settle(['late']);

    await expect(pending).resolves.toEqual(['late']);
  });
});

// `result.current` cannot observe the cancellation guard — an unmounted component never
// re-renders, so the assertion would hold whether or not the guard exists. Drive the guard
// directly instead, which is the only way to prove it actually suppresses the update.
describe('AsyncListLoader cancellation guard', () => {
  it('applies the resolved items while the subscription is active', async () => {
    const apply = jest.fn();

    await asyncListLoader.run(() => Promise.resolve(['alpha']), { active: true }, apply);

    expect(apply).toHaveBeenCalledWith({
      items: ['alpha'],
      isLoading: false,
      hasError: false,
    });
  });

  it('applies the error state while the subscription is active', async () => {
    const apply = jest.fn();

    await asyncListLoader.run(() => Promise.reject(new Error('gone')), { active: true }, apply);

    expect(apply).toHaveBeenCalledWith({ items: [], isLoading: false, hasError: true });
  });

  it('suppresses the resolved update once the subscription is cancelled', async () => {
    const apply = jest.fn();

    await asyncListLoader.run(() => Promise.resolve(['alpha']), { active: false }, apply);

    expect(apply).not.toHaveBeenCalled();
  });

  it('suppresses the error update once the subscription is cancelled', async () => {
    const apply = jest.fn();

    await asyncListLoader.run(() => Promise.reject(new Error('gone')), { active: false }, apply);

    expect(apply).not.toHaveBeenCalled();
  });

  it('observes cancellation that happens while the loader is in flight', async () => {
    const apply = jest.fn();
    const subscription = { active: true };
    let settle: (items: string[]) => void = () => {};
    const pending = new Promise<string[]>((resolve) => {
      settle = resolve;
    });

    const running = asyncListLoader.run(() => pending, subscription, apply);
    subscription.active = false;
    settle(['late']);
    await running;

    expect(apply).not.toHaveBeenCalled();
  });
});
