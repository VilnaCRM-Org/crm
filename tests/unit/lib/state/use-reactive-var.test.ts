import { act, renderHook } from '@testing-library/react';

import ReactiveVarFactory from '@/lib/state/reactive-var-factory';
import useReactiveVar from '@/lib/state/use-reactive-var';

interface Counter {
  count: number;
  label: string;
}

describe('useReactiveVar', () => {
  it('renders the selected slice and re-renders when it changes', () => {
    const counter = new ReactiveVarFactory().create<Counter>({ count: 0, label: 'a' });
    const { result } = renderHook(() =>
      useReactiveVar(counter, (value: Counter): number => value.count)
    );
    expect(result.current).toBe(0);

    act(() => {
      counter({ count: 1, label: 'a' });
    });
    expect(result.current).toBe(1);
  });

  it('skips the re-render when a write leaves the selected slice unchanged', () => {
    const counter = new ReactiveVarFactory().create<Counter>({ count: 0, label: 'a' });
    let hookCalls = 0;
    const { result } = renderHook(() => {
      hookCalls += 1;
      return useReactiveVar(counter, (value: Counter): number => value.count);
    });
    const callsAfterMount = hookCalls;

    act(() => {
      counter({ count: 0, label: 'b' });
    });

    expect(result.current).toBe(0);
    expect(hookCalls).toBe(callsAfterMount);
  });

  it('returns the whole value for an identity selector', () => {
    const counter = new ReactiveVarFactory().create<Counter>({ count: 0, label: 'a' });
    const { result } = renderHook(() =>
      useReactiveVar(counter, (value: Counter): Counter => value)
    );
    const next = { count: 2, label: 'c' };

    act(() => {
      counter(next);
    });

    expect(result.current).toBe(next);
  });

  it('returns the same slice object across reads while the store is unchanged', () => {
    const counter = new ReactiveVarFactory().create<Counter>({ count: 0, label: 'a' });
    const select = (value: Counter): { doubled: number } => ({ doubled: value.count * 2 });
    const { result, rerender } = renderHook(() => useReactiveVar(counter, select));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
    expect(first).toEqual({ doubled: 0 });
  });

  it('recomputes an object slice only when the store value changes', () => {
    const counter = new ReactiveVarFactory().create<Counter>({ count: 1, label: 'a' });
    const select = jest.fn((value: Counter): { doubled: number } => ({
      doubled: value.count * 2,
    }));
    const { result } = renderHook(() => useReactiveVar(counter, select));
    const first = result.current;
    select.mockClear();

    act(() => {
      counter({ count: 2, label: 'a' });
    });

    expect(result.current).not.toBe(first);
    expect(result.current).toEqual({ doubled: 4 });
    expect(select).toHaveBeenCalledWith({ count: 2, label: 'a' });
  });

  it('recomputes the slice when the selector itself changes', () => {
    const counter = new ReactiveVarFactory().create<Counter>({ count: 3, label: 'a' });
    const { result, rerender } = renderHook(
      ({ select }: { select: (value: Counter) => number }) => useReactiveVar(counter, select),
      { initialProps: { select: (value: Counter): number => value.count } }
    );
    expect(result.current).toBe(3);

    rerender({ select: (value: Counter): number => value.count * 10 });

    expect(result.current).toBe(30);
  });

  it('unsubscribes on unmount so later writes reach no listener', () => {
    const counter = new ReactiveVarFactory().create<Counter>({ count: 0, label: 'a' });
    const subscribe = jest.spyOn(counter, 'subscribe');
    const { unmount } = renderHook(() =>
      useReactiveVar(counter, (value: Counter): number => value.count)
    );
    expect(subscribe).toHaveBeenCalledTimes(1);

    const listener = jest.fn();
    const unsubscribeProbe = counter.subscribe(listener);
    unmount();
    act(() => {
      counter({ count: 5, label: 'a' });
    });

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribeProbe();
  });

  it('subscribes once per mount, not once per render', () => {
    const counter = new ReactiveVarFactory().create<Counter>({ count: 0, label: 'a' });
    const subscribe = jest.spyOn(counter, 'subscribe');
    const { rerender } = renderHook(() =>
      useReactiveVar(counter, (value: Counter): number => value.count)
    );

    rerender();
    act(() => {
      counter({ count: 1, label: 'a' });
    });
    rerender();

    expect(subscribe).toHaveBeenCalledTimes(1);
  });
});
