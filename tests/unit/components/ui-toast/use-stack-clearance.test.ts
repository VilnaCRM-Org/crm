import { act, renderHook } from '@testing-library/react';

import type { ToastItemSet } from '@/components/types/ui-toast';
import useStackClearance from '@/components/ui-toast/use-stack-clearance';

const padding = (): string =>
  document.documentElement.style.getPropertyValue('scroll-padding-bottom');

const stack = (height: number): HTMLDivElement => {
  const node = document.createElement('div');
  jest.spyOn(node, 'getBoundingClientRect').mockReturnValue({ height } as DOMRect);
  return node;
};

const toastSet = (...ids: number[]): ToastItemSet => ({
  items: ids.map((id) => ({ id, tone: 'success', message: `toast ${id}` })),
});

const resize = (): void => {
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

describe('useStackClearance', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('scroll-padding-bottom');
    jest.restoreAllMocks();
  });

  it('sets the scroll padding to the measured stack height', () => {
    renderHook(() => useStackClearance({ current: stack(96) }, toastSet(1)));

    expect(padding()).toBe('96px');
  });

  it('sets nothing while no stack is mounted', () => {
    const setProperty = jest.spyOn(document.documentElement.style, 'setProperty');
    const addListener = jest.spyOn(window, 'addEventListener');

    const { unmount } = renderHook(() => useStackClearance({ current: null }, toastSet()));
    resize();
    unmount();

    expect(setProperty).not.toHaveBeenCalled();
    expect(addListener).not.toHaveBeenCalledWith('resize', expect.any(Function));
    expect(padding()).toBe('');
  });

  it('measures again when the toast set changes, and only then', () => {
    const node = stack(61);
    const measure = jest.mocked(node.getBoundingClientRect);
    const ref = { current: node };
    const shown = toastSet(1, 2, 3);
    const { rerender } = renderHook(({ toasts }) => useStackClearance(ref, toasts), {
      initialProps: { toasts: shown },
    });

    measure.mockReturnValue({ height: 130 } as DOMRect);
    rerender({ toasts: shown });

    expect(padding()).toBe('61px');

    rerender({ toasts: toastSet(2, 3, 4) });

    expect(padding()).toBe('130px');
    expect(measure).toHaveBeenCalledTimes(2);
  });

  it('measures again on a window resize while the stack is shown', () => {
    const node = stack(61);
    const measure = jest.mocked(node.getBoundingClientRect);
    renderHook(() => useStackClearance({ current: node }, toastSet(1)));

    measure.mockReturnValue({ height: 88 } as DOMRect);
    resize();

    expect(padding()).toBe('88px');
    expect(measure).toHaveBeenCalledTimes(2);
  });

  it('stops listening for resizes once the stack goes away', () => {
    const node = stack(61);
    const measure = jest.mocked(node.getBoundingClientRect);
    const ref: { current: HTMLDivElement | null } = { current: node };
    const { rerender, unmount } = renderHook(({ toasts }) => useStackClearance(ref, toasts), {
      initialProps: { toasts: toastSet(1) },
    });

    ref.current = null;
    rerender({ toasts: toastSet() });
    resize();

    expect(padding()).toBe('');
    expect(measure).toHaveBeenCalledTimes(1);

    unmount();

    expect(padding()).toBe('');
  });

  it('removes its resize listener on unmount', () => {
    const node = stack(61);
    const measure = jest.mocked(node.getBoundingClientRect);
    const { unmount } = renderHook(() => useStackClearance({ current: node }, toastSet(1)));

    unmount();
    resize();

    expect(padding()).toBe('');
    expect(measure).toHaveBeenCalledTimes(1);
  });
});
