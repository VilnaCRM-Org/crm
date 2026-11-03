import { renderHook } from '@testing-library/react';

import useEscapeCancel from '@/modules/user/features/settings/hooks/use-escape-cancel';

const press = (key: string): void => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key }));
};

describe('useEscapeCancel', () => {
  it('calls cancel once for Escape', () => {
    const cancel = jest.fn();
    renderHook(() => useEscapeCancel(cancel, false));

    press('Escape');

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it.each(['Enter', 'Esc', 'a', ' '])('ignores %s', (key) => {
    const cancel = jest.fn();
    renderHook(() => useEscapeCancel(cancel, false));

    press(key);

    expect(cancel).not.toHaveBeenCalled();
  });

  it('stops listening after unmount', () => {
    const cancel = jest.fn();
    const { unmount } = renderHook(() => useEscapeCancel(cancel, false));

    unmount();
    press('Escape');

    expect(cancel).not.toHaveBeenCalled();
  });

  it('calls the latest cancel after a re-render, never the old one', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = renderHook(({ cancel }) => useEscapeCancel(cancel, false), {
      initialProps: { cancel: first },
    });

    rerender({ cancel: second });
    press('Escape');

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape while disabled', () => {
    const cancel = jest.fn();
    renderHook(() => useEscapeCancel(cancel, true));

    press('Escape');

    expect(cancel).not.toHaveBeenCalled();
  });

  it('cancels on Escape again once it is no longer disabled', () => {
    const cancel = jest.fn();
    const { rerender } = renderHook(({ disabled }) => useEscapeCancel(cancel, disabled), {
      initialProps: { disabled: true },
    });
    press('Escape');

    rerender({ disabled: false });
    press('Escape');

    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
