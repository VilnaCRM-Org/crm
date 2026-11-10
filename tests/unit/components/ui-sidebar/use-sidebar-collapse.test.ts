import { act, renderHook } from '@testing-library/react';
import * as React from 'react';

import useSidebarCollapse from '@/components/ui-sidebar/use-sidebar-collapse';
import loadIsolated from '@tests/unit/utils/isolated-module';

const STORAGE_KEY = 'crm.sidebar.collapsed';
const CLICK = { type: 'click' } as const;

describe('useSidebarCollapse', () => {
  afterEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('starts expanded with nothing revealing on a hook loaded in the test', async () => {
    const fresh = await loadIsolated(async () => {
      jest.doMock('react', () => React);
      return (await import('@/components/ui-sidebar/use-sidebar-collapse')).default;
    });

    const { result } = renderHook(() => fresh());

    expect(result.current.collapsed).toBe(false);
    expect(result.current.revealing).toBe(false);
  });

  it('starts expanded with nothing revealing when nothing is stored', () => {
    const { result } = renderHook(() => useSidebarCollapse());

    expect(result.current.collapsed).toBe(false);
    expect(result.current.revealing).toBe(false);
  });

  it('restores the stored collapsed state on first render, with nothing revealing', () => {
    window.localStorage.setItem(STORAGE_KEY, 'true');

    const { result } = renderHook(() => useSidebarCollapse());

    expect(result.current.collapsed).toBe(true);
    expect(result.current.revealing).toBe(false);
  });

  it('treats any other stored value as expanded', () => {
    window.localStorage.setItem(STORAGE_KEY, 'yes');

    const { result } = renderHook(() => useSidebarCollapse());

    expect(result.current.collapsed).toBe(false);
  });

  it('collapses with no reveal, then expands and reveals the labels', () => {
    const { result } = renderHook(() => useSidebarCollapse());

    act(() => result.current.step(CLICK));
    expect(result.current.collapsed).toBe(true);
    expect(result.current.revealing).toBe(false);

    act(() => result.current.step(CLICK));
    expect(result.current.collapsed).toBe(false);
    expect(result.current.revealing).toBe(true);
  });

  it('ends the reveal on animation end and keeps the collapsed state', () => {
    const { result } = renderHook(() => useSidebarCollapse());
    act(() => result.current.step(CLICK));
    act(() => result.current.step(CLICK));

    act(() => result.current.step({ type: 'animationend' }));

    expect(result.current.revealing).toBe(false);
    expect(result.current.collapsed).toBe(false);
  });

  it('keeps one stable handler across renders', () => {
    const { result } = renderHook(() => useSidebarCollapse());
    const first = result.current.step;

    act(() => result.current.step(CLICK));

    expect(result.current.step).toBe(first);
  });

  it('writes every toggle to storage, so a remount keeps the position', () => {
    const { result: firstMount, unmount } = renderHook(() => useSidebarCollapse());

    act(() => firstMount.current.step(CLICK));

    expect(firstMount.current.collapsed).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true');
    unmount();

    const { result: secondMount } = renderHook(() => useSidebarCollapse());
    expect(secondMount.current.collapsed).toBe(true);

    act(() => secondMount.current.step(CLICK));

    expect(secondMount.current.collapsed).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false');
  });

  it('does not write on animation end', () => {
    const { result } = renderHook(() => useSidebarCollapse());
    act(() => result.current.step(CLICK));
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    act(() => result.current.step({ type: 'animationend' }));

    expect(setItem).not.toHaveBeenCalled();
  });

  it('starts expanded when storage cannot be read', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    const { result } = renderHook(() => useSidebarCollapse());

    expect(result.current.collapsed).toBe(false);
  });

  it('still toggles when storage cannot be written', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const { result } = renderHook(() => useSidebarCollapse());

    act(() => result.current.step(CLICK));

    expect(result.current.collapsed).toBe(true);
  });
});
