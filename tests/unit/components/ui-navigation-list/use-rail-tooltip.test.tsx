import { act, renderHook } from '@testing-library/react';
import type { KeyboardEvent } from 'react';

import useRailTooltip from '@/components/ui-navigation-list/use-rail-tooltip';

const key = (value: string): KeyboardEvent<HTMLDivElement> =>
  ({ key: value }) as KeyboardEvent<HTMLDivElement>;

const enter = (handler: ((event: never) => void) | undefined): void =>
  act(() => handler?.({} as never));

describe('useRailTooltip', () => {
  it('starts hidden', () => {
    expect(renderHook(() => useRailTooltip()).result.current.visible).toBe(false);
  });

  it('shows on hover and hides when the pointer leaves', () => {
    const { result } = renderHook(() => useRailTooltip());

    enter(result.current.handlers.onMouseEnter);
    expect(result.current.visible).toBe(true);

    enter(result.current.handlers.onMouseLeave);
    expect(result.current.visible).toBe(false);
  });

  it('shows on focus and hides on blur', () => {
    const { result } = renderHook(() => useRailTooltip());

    enter(result.current.handlers.onFocus);
    expect(result.current.visible).toBe(true);

    enter(result.current.handlers.onBlur);
    expect(result.current.visible).toBe(false);
  });

  it('hides on Escape and stays hidden while the pointer or focus remains', () => {
    const { result } = renderHook(() => useRailTooltip());

    enter(result.current.handlers.onFocus);
    act(() => result.current.handlers.onKeyDown?.(key('Escape')));
    expect(result.current.visible).toBe(false);

    enter(result.current.handlers.onMouseEnter);
    expect(result.current.visible).toBe(false);
  });

  it('shows again after a dismissed tooltip is left and entered anew', () => {
    const { result } = renderHook(() => useRailTooltip());

    enter(result.current.handlers.onFocus);
    act(() => result.current.handlers.onKeyDown?.(key('Escape')));
    enter(result.current.handlers.onBlur);
    enter(result.current.handlers.onFocus);

    expect(result.current.visible).toBe(true);
  });

  it('ignores every other key', () => {
    const { result } = renderHook(() => useRailTooltip());

    enter(result.current.handlers.onFocus);
    act(() => result.current.handlers.onKeyDown?.(key('Enter')));

    expect(result.current.visible).toBe(true);
  });
});
