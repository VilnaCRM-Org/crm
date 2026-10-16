import { renderHook } from '@testing-library/react';

import useStackClearance from '@/components/ui-toast/use-stack-clearance';

const padding = (): string =>
  document.documentElement.style.getPropertyValue('scroll-padding-bottom');

const stack = (height: number): HTMLDivElement => {
  const node = document.createElement('div');
  jest.spyOn(node, 'getBoundingClientRect').mockReturnValue({ height } as DOMRect);
  return node;
};

describe('useStackClearance', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('scroll-padding-bottom');
    jest.restoreAllMocks();
  });

  it('sets the scroll padding to the measured stack height', () => {
    renderHook(() => useStackClearance({ current: stack(96) }, 1));

    expect(padding()).toBe('96px');
  });

  it('sets nothing while no stack is mounted', () => {
    const setProperty = jest.spyOn(document.documentElement.style, 'setProperty');

    const { unmount } = renderHook(() => useStackClearance({ current: null }, 0));
    unmount();

    expect(setProperty).not.toHaveBeenCalled();
    expect(padding()).toBe('');
  });

  it('measures again when the count changes, and only then', () => {
    const node = stack(61);
    const measure = jest.mocked(node.getBoundingClientRect);
    const ref = { current: node };
    const { rerender } = renderHook(({ count }) => useStackClearance(ref, count), {
      initialProps: { count: 1 },
    });

    measure.mockReturnValue({ height: 130 } as DOMRect);
    rerender({ count: 1 });

    expect(padding()).toBe('61px');

    rerender({ count: 2 });

    expect(padding()).toBe('130px');
    expect(measure).toHaveBeenCalledTimes(2);
  });

  it('clears the scroll padding when the stack goes away', () => {
    const ref: { current: HTMLDivElement | null } = { current: stack(61) };
    const { rerender, unmount } = renderHook(({ count }) => useStackClearance(ref, count), {
      initialProps: { count: 1 },
    });

    ref.current = null;
    rerender({ count: 0 });

    expect(padding()).toBe('');

    unmount();

    expect(padding()).toBe('');
  });
});
