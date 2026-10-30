import { act, renderHook } from '@testing-library/react';

import useDocumentEscape from '@/components/ui-navigation-list/use-document-escape';

const press = (key: string): void =>
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key }));
  });

describe('useDocumentEscape', () => {
  it('calls back on an Escape pressed anywhere in the document while active', () => {
    const onEscape = jest.fn();
    renderHook(() => useDocumentEscape(true, onEscape));

    press('Escape');

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('ignores every other key', () => {
    const onEscape = jest.fn();
    renderHook(() => useDocumentEscape(true, onEscape));

    press('Enter');

    expect(onEscape).not.toHaveBeenCalled();
  });

  it('does not listen while inactive', () => {
    const onEscape = jest.fn();
    renderHook(() => useDocumentEscape(false, onEscape));

    press('Escape');

    expect(onEscape).not.toHaveBeenCalled();
  });

  it('starts and stops listening as it is activated and deactivated', () => {
    const onEscape = jest.fn();
    const { rerender } = renderHook(({ active }) => useDocumentEscape(active, onEscape), {
      initialProps: { active: false },
    });

    rerender({ active: true });
    press('Escape');
    rerender({ active: false });
    press('Escape');

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('calls the latest callback after it changes', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = renderHook(({ onEscape }) => useDocumentEscape(true, onEscape), {
      initialProps: { onEscape: first },
    });

    rerender({ onEscape: second });
    press('Escape');

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('removes the listener it added when it unmounts', () => {
    const add = jest.spyOn(document, 'addEventListener');
    const remove = jest.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useDocumentEscape(true, jest.fn()));
    const added = add.mock.calls.find(([type]) => type === 'keydown');

    unmount();

    expect(added).toBeDefined();
    expect(remove).toHaveBeenCalledWith('keydown', added?.[1]);
    add.mockRestore();
    remove.mockRestore();
  });
});
