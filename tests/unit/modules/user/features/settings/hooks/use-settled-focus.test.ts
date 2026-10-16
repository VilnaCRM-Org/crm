import { renderHook } from '@testing-library/react';

import useSettledFocus from '@/modules/user/features/settings/hooks/use-settled-focus';

const buttonRef = (focus: jest.Mock): { current: HTMLButtonElement } => ({
  current: { focus } as unknown as HTMLButtonElement,
});

describe('useSettledFocus', () => {
  it('leaves focus alone before any save settled', () => {
    const focus = jest.fn();

    renderHook(() => useSettledFocus(0, buttonRef(focus)));

    expect(focus).not.toHaveBeenCalled();
  });

  it('focuses the save button once per settled save', () => {
    const focus = jest.fn();
    const saveRef = buttonRef(focus);
    const { rerender } = renderHook(({ settled }) => useSettledFocus(settled, saveRef), {
      initialProps: { settled: 0 },
    });

    rerender({ settled: 1 });
    rerender({ settled: 1 });
    rerender({ settled: 2 });

    expect(focus).toHaveBeenCalledTimes(2);
  });

  it('does nothing when the save button is not mounted', () => {
    const saveRef = { current: null };
    const { rerender } = renderHook(({ settled }) => useSettledFocus(settled, saveRef), {
      initialProps: { settled: 0 },
    });

    expect(() => rerender({ settled: 1 })).not.toThrow();
  });
});
