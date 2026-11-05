import { act, renderHook } from '@testing-library/react';

import useSidebarCollapse from '@/components/ui-sidebar/use-sidebar-collapse';

describe('useSidebarCollapse', () => {
  it('starts expanded with nothing revealing', () => {
    const { result } = renderHook(() => useSidebarCollapse());

    expect(result.current.collapsed).toBe(false);
    expect(result.current.revealing).toBe(false);
  });

  it('collapses with no reveal, then expands and reveals the labels', () => {
    const { result } = renderHook(() => useSidebarCollapse());

    act(() => result.current.step({ type: 'click' }));
    expect(result.current.collapsed).toBe(true);
    expect(result.current.revealing).toBe(false);

    act(() => result.current.step({ type: 'click' }));
    expect(result.current.collapsed).toBe(false);
    expect(result.current.revealing).toBe(true);
  });

  it('treats a click event as a toggle', () => {
    const { result } = renderHook(() => useSidebarCollapse());

    act(() => result.current.step({ type: 'click' }));

    expect(result.current.collapsed).toBe(true);
  });

  it('ends the reveal on animation end and keeps the collapsed state', () => {
    const { result } = renderHook(() => useSidebarCollapse());
    act(() => result.current.step({ type: 'click' }));
    act(() => result.current.step({ type: 'click' }));

    act(() => result.current.step({ type: 'animationend' }));

    expect(result.current.revealing).toBe(false);
    expect(result.current.collapsed).toBe(false);
  });

  it('keeps one stable handler across renders', () => {
    const { result } = renderHook(() => useSidebarCollapse());
    const first = result.current.step;

    act(() => result.current.step({ type: 'click' }));

    expect(result.current.step).toBe(first);
  });
});
