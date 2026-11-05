import { act, renderHook } from '@testing-library/react';

import useSidebarCollapse from '@/components/ui-sidebar/use-sidebar-collapse';

const STORAGE_KEY = 'crm.sidebar.collapsed';

describe('useSidebarCollapse', () => {
  afterEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('starts expanded when nothing is stored', () => {
    const { result } = renderHook(() => useSidebarCollapse());

    expect(result.current.collapsed).toBe(false);
  });

  it('restores the stored collapsed state on first render', () => {
    window.localStorage.setItem(STORAGE_KEY, 'true');

    const { result } = renderHook(() => useSidebarCollapse());

    expect(result.current.collapsed).toBe(true);
  });

  it('treats any other stored value as expanded', () => {
    window.localStorage.setItem(STORAGE_KEY, 'yes');

    const { result } = renderHook(() => useSidebarCollapse());

    expect(result.current.collapsed).toBe(false);
  });

  it('writes every flip to storage, so a remount keeps the position', () => {
    const { result: firstMount, unmount } = renderHook(() => useSidebarCollapse());

    act(() => firstMount.current.flip());

    expect(firstMount.current.collapsed).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true');
    unmount();

    const { result: secondMount } = renderHook(() => useSidebarCollapse());
    expect(secondMount.current.collapsed).toBe(true);

    act(() => secondMount.current.flip());

    expect(secondMount.current.collapsed).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false');
  });

  it('starts expanded when storage cannot be read', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    const { result } = renderHook(() => useSidebarCollapse());

    expect(result.current.collapsed).toBe(false);
  });

  it('still flips when storage cannot be written', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const { result } = renderHook(() => useSidebarCollapse());

    act(() => result.current.flip());

    expect(result.current.collapsed).toBe(true);
  });
});
