import { act, renderHook } from '@testing-library/react';

import useDrawerOpen from '@/components/ui-app-header/use-drawer-open';

describe('useDrawerOpen', () => {
  it('starts closed and without a focus restore', () => {
    const { result } = renderHook(() => useDrawerOpen());

    expect(result.current.open).toBe(false);
    expect(result.current.restore).toBe(false);
  });

  it('opens on show', () => {
    const { result } = renderHook(() => useDrawerOpen());

    act(() => result.current.show());

    expect(result.current.open).toBe(true);
    expect(result.current.restore).toBe(false);
  });

  it('closes on dismiss and asks for the burger to get focus back', () => {
    const { result } = renderHook(() => useDrawerOpen());
    act(() => result.current.show());

    act(() => result.current.dismiss());

    expect(result.current.open).toBe(false);
    expect(result.current.restore).toBe(true);
  });

  it('closes on leave without asking for a restore', () => {
    const { result } = renderHook(() => useDrawerOpen());
    act(() => result.current.show());

    act(() => result.current.leave());

    expect(result.current.open).toBe(false);
    expect(result.current.restore).toBe(false);
  });

  it('drops the restore request when the drawer opens again', () => {
    const { result } = renderHook(() => useDrawerOpen());
    act(() => result.current.show());
    act(() => result.current.dismiss());

    act(() => result.current.show());

    expect(result.current.restore).toBe(false);
  });

  it('keeps its handlers stable across renders and state changes', () => {
    const { result, rerender } = renderHook(() => useDrawerOpen());
    const { show, dismiss, leave } = result.current;

    rerender();
    act(() => result.current.show());
    act(() => result.current.dismiss());

    expect(result.current.restore).toBe(true);
    expect(result.current.show).toBe(show);
    expect(result.current.dismiss).toBe(dismiss);
    expect(result.current.leave).toBe(leave);
  });
});
