import { renderHook } from '@testing-library/react';

import useOnceCallback from '@/hooks/use-once-callback';

describe('useOnceCallback', () => {
  it('runs the callback on the first call', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useOnceCallback(callback));

    result.current();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('ignores every later call, also across re-renders', () => {
    const callback = jest.fn();
    const { result, rerender } = renderHook(() => useOnceCallback(callback));

    result.current();
    rerender();
    result.current();
    result.current();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('gives each mount its own latch', () => {
    const callback = jest.fn();
    const { result: firstMount } = renderHook(() => useOnceCallback(callback));
    const { result: secondMount } = renderHook(() => useOnceCallback(callback));

    firstMount.current();
    secondMount.current();

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('keeps the same function while the callback is the same', () => {
    const callback = jest.fn();
    const { result, rerender } = renderHook(() => useOnceCallback(callback));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
