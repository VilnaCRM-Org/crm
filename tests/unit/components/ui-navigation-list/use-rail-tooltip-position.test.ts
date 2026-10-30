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

  it('measures again at once when it is handed a new anchor or offset', () => {
    const first = movableAnchor();
    const second = movableAnchor();
    second.move(300);
    const { result, rerender } = renderHook(
      ({ anchor, offset }) => useRailTooltipPosition(anchor, offset),
      { initialProps: { anchor: first.anchor, offset: OFFSET } }
    );

    rerender({ anchor: first.anchor, offset: { left: 65, top: 8 } });
    expect(result.current).toEqual({ left: 77, top: 208 });

    rerender({ anchor: second.anchor, offset: { left: 65, top: 8 } });
    expect(result.current).toEqual({ left: 77, top: 308 });
  });

  it('follows a new anchor and offset on the next relayout', () => {
    const first = movableAnchor();
    const second = movableAnchor();
    second.move(300);
    const { result, rerender } = renderHook(
      ({ anchor, offset }) => useRailTooltipPosition(anchor, offset),
      { initialProps: { anchor: first.anchor, offset: OFFSET } }
    );

    rerender({ anchor: second.anchor, offset: { left: 10, top: 20 } });
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toEqual({ left: 22, top: 320 });
  });
});
