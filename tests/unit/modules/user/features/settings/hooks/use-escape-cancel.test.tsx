import { renderHook } from '@testing-library/react';

import useEscapeCancel from '@/modules/user/features/settings/hooks/use-escape-cancel';

const press = (key: string): void => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key }));
};

describe('useEscapeCancel', () => {
  it('calls cancel once for Escape', () => {
    const cancel = jest.fn();
    renderHook(() => useEscapeCancel(cancel));

    press('Escape');

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it.each(['Enter', 'Esc', 'a', ' '])('ignores %s', (key) => {
    const cancel = jest.fn();
    renderHook(() => useEscapeCancel(cancel));

    press(key);

    expect(cancel).not.toHaveBeenCalled();
  });

  it('stops listening after unmount', () => {
    const cancel = jest.fn();
    const { unmount } = renderHook(() => useEscapeCancel(cancel));

    unmount();
    press('Escape');

    expect(cancel).not.toHaveBeenCalled();
  });

  it('calls the latest cancel after a re-render, never the old one', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = renderHook(({ cancel }) => useEscapeCancel(cancel), {
      initialProps: { cancel: first },
    });

    rerender({ cancel: second });
    press('Escape');

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
