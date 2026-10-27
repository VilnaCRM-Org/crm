import { act, renderHook } from '@testing-library/react';

import useRailTooltipPosition from '@/components/ui-navigation-list/use-rail-tooltip-position';

const OFFSET = { left: 61, top: 4 };

const movableAnchor = (): { readonly anchor: HTMLElement; move: (top: number) => void } => {
  let top = 200;
  const anchor = document.createElement('div');
  anchor.getBoundingClientRect = (): DOMRect => new DOMRect(12, top, 72, 54);

  return {
    anchor,
    move: (next: number): void => {
      top = next;
    },
  };
};

describe('useRailTooltipPosition', () => {
  it('places the tooltip at the row box plus the offset on first render', () => {
    const { anchor } = movableAnchor();

    const { result } = renderHook(() => useRailTooltipPosition(anchor, OFFSET));

    expect(result.current).toEqual({ left: 73, top: 204 });
  });

  it('re-measures on a scroll of any element, caught in the capture phase', () => {
    const { anchor, move } = movableAnchor();
    const scroller = document.createElement('ol');
    document.body.append(scroller);
    const { result } = renderHook(() => useRailTooltipPosition(anchor, OFFSET));

    move(120);
    act(() => {
      scroller.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toEqual({ left: 73, top: 124 });
    scroller.remove();
  });

  it('re-measures on a window resize', () => {
    const { anchor, move } = movableAnchor();
    const { result } = renderHook(() => useRailTooltipPosition(anchor, OFFSET));

    move(50);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toEqual({ left: 73, top: 54 });
  });

  it('removes both listeners on unmount', () => {
    const { anchor } = movableAnchor();
    const measure = jest.spyOn(anchor, 'getBoundingClientRect');
    const { unmount } = renderHook(() => useRailTooltipPosition(anchor, OFFSET));
    const calls = measure.mock.calls.length;

    unmount();
    document.body.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));

    expect(measure).toHaveBeenCalledTimes(calls);
  });
});
