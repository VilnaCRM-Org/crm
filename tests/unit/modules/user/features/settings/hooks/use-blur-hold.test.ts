import { act, renderHook } from '@testing-library/react';
import type { FocusEvent } from 'react';

import useBlurHold from '@/modules/user/features/settings/hooks/use-blur-hold';

const blurAt = (timeStamp: number): FocusEvent<HTMLElement> =>
  ({ timeStamp }) as unknown as FocusEvent<HTMLElement>;

describe('useBlurHold', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('holds nothing and schedules nothing before a blur', () => {
    const { result } = renderHook(() => useBlurHold(200));

    expect(result.current.held).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('holds from the blur until the delay has passed', () => {
    const { result } = renderHook(() => useBlurHold(200));

    act(() => result.current.onBlur(blurAt(10)));

    expect(result.current.held).toBe(true);

    act(() => {
      jest.advanceTimersByTime(199);
    });

    expect(result.current.held).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current.held).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('restarts the delay on every new blur', () => {
    const { result } = renderHook(() => useBlurHold(200));

    act(() => result.current.onBlur(blurAt(10)));
    act(() => {
      jest.advanceTimersByTime(150);
    });
    act(() => result.current.onBlur(blurAt(160)));
    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(result.current.held).toBe(true);
    expect(jest.getTimerCount()).toBe(1);

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(result.current.held).toBe(false);
  });

  it('uses the delay it was given', () => {
    const { result } = renderHook(() => useBlurHold(500));

    act(() => result.current.onBlur(blurAt(10)));
    act(() => {
      jest.advanceTimersByTime(499);
    });

    expect(result.current.held).toBe(true);
  });

  it('cancels a pending release when it unmounts', () => {
    const { result, unmount } = renderHook(() => useBlurHold(200));

    act(() => result.current.onBlur(blurAt(10)));
    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
