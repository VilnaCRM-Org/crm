import { renderHook } from '@testing-library/react';

import useOptionalFocus from '@/modules/user/features/settings/hooks/use-optional-focus';

const nodeWithSpy = (): { node: HTMLButtonElement; focus: jest.SpyInstance } => {
  const node = document.createElement('button');
  return { node, focus: jest.spyOn(node, 'focus') };
};

describe('useOptionalFocus', () => {
  it('focuses the node it receives when enabled', () => {
    const { result } = renderHook(() => useOptionalFocus<HTMLButtonElement>(true));
    const { node, focus } = nodeWithSpy();

    result.current(node);

    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('leaves the node alone when disabled', () => {
    const { result } = renderHook(() => useOptionalFocus<HTMLButtonElement>(false));
    const { node, focus } = nodeWithSpy();

    result.current(node);

    expect(focus).not.toHaveBeenCalled();
  });

  it('ignores a null node either way', () => {
    const { result: on } = renderHook(() => useOptionalFocus<HTMLButtonElement>(true));
    const { result: off } = renderHook(() => useOptionalFocus<HTMLButtonElement>(false));

    expect(() => {
      on.current(null);
      off.current(null);
    }).not.toThrow();
  });

  it('returns the same callback for the same setting across renders', () => {
    const { result, rerender } = renderHook(() => useOptionalFocus<HTMLButtonElement>(false));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
