import { renderHook } from '@testing-library/react';
import type { KeyboardEvent } from 'react';

import useUserMenuKeys from '@/modules/user/features/settings/hooks/use-user-menu-keys';

const keyEvent = (key: string): KeyboardEvent<HTMLButtonElement> & { preventDefault: jest.Mock } =>
  ({ key, preventDefault: jest.fn() }) as never;

describe('useUserMenuKeys', () => {
  it('opens on ArrowDown from the chip and stops the page from scrolling', () => {
    const show = jest.fn();
    const { result } = renderHook(() => useUserMenuKeys({ show, dismiss: jest.fn() }));
    const event = keyEvent('ArrowDown');

    result.current.chipKeyDown(event);

    expect(show).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it.each(['Enter', ' ', 'ArrowUp', 'Escape', 'Tab'])('ignores %j on the chip', (key) => {
    const show = jest.fn();
    const { result } = renderHook(() => useUserMenuKeys({ show, dismiss: jest.fn() }));
    const event = keyEvent(key);

    result.current.chipKeyDown(event);

    expect(show).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it.each(['Escape', 'Tab'])('dismisses the menu on %s without stopping the key', (key) => {
    const dismiss = jest.fn();
    const { result } = renderHook(() => useUserMenuKeys({ show: jest.fn(), dismiss }));
    const event = keyEvent(key);

    result.current.menuKeyDown(event);

    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it.each(['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', 'a'])('keeps the menu on %s', (key) => {
    const dismiss = jest.fn();
    const { result } = renderHook(() => useUserMenuKeys({ show: jest.fn(), dismiss }));

    result.current.menuKeyDown(keyEvent(key));

    expect(dismiss).not.toHaveBeenCalled();
  });

  it('keeps its handlers stable while show and dismiss are', () => {
    const options = { show: jest.fn(), dismiss: jest.fn() };
    const { result, rerender } = renderHook(() => useUserMenuKeys(options));
    const { chipKeyDown, menuKeyDown } = result.current;

    rerender();

    expect(result.current.chipKeyDown).toBe(chipKeyDown);
    expect(result.current.menuKeyDown).toBe(menuKeyDown);
  });
});
