import { act, renderHook } from '@testing-library/react';

import useCopiedHold from '@/modules/user/features/settings/hooks/use-copied-hold';

type CopiedHoldRequest = Parameters<typeof useCopiedHold>[0];

const IDLE: CopiedHoldRequest = { status: 'idle', message: '' };
const COPIED: CopiedHoldRequest = { status: 'copied', message: 'copied' };
const COPIED_AGAIN: CopiedHoldRequest = { status: 'copied', message: 'copied again' };
const FAILED: CopiedHoldRequest = { status: 'failed', message: 'failed' };

const elapse = (ms: number): void => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

const follow = (
  request: CopiedHoldRequest
): ReturnType<typeof renderHook<boolean, CopiedHoldRequest>> =>
  renderHook((props: CopiedHoldRequest) => useCopiedHold(props), { initialProps: request });

describe('useCopiedHold', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('holds nothing before a copy', () => {
    const { result } = follow(IDLE);

    expect(result.current).toBe(false);
  });

  it('holds a copy for exactly 3 s', () => {
    const { result } = follow(COPIED);
    elapse(2999);
    expect(result.current).toBe(true);
    elapse(1);

    expect(result.current).toBe(false);
  });

  it('holds nothing for a failed copy', () => {
    const { result } = follow(FAILED);

    expect(result.current).toBe(false);
  });

  it('drops the hold at once when a repeat copy fails', () => {
    const { result, rerender } = follow(COPIED);

    rerender(FAILED);

    expect(result.current).toBe(false);
  });

  it('restarts the hold for a new message of the same status', () => {
    const { result, rerender } = follow(COPIED);
    elapse(2000);
    rerender(COPIED_AGAIN);
    elapse(2999);
    expect(result.current).toBe(true);
    elapse(1);

    expect(result.current).toBe(false);
  });

  it('keeps the hold across idle, for at most 3 s', () => {
    const { result, rerender } = follow(COPIED);
    elapse(1000);
    rerender(IDLE);
    elapse(2999);
    expect(result.current).toBe(true);
    elapse(1);

    expect(result.current).toBe(false);
  });

  it('leaves no timer behind on unmount', () => {
    const { unmount } = follow(COPIED);
    expect(jest.getTimerCount()).toBe(1);

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
