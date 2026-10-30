import { act, render, renderHook, screen } from '@testing-library/react';
import { type JSX, type KeyboardEvent, type ReactNode, useLayoutEffect } from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';

import type { ShellLayout } from '@/components/types/ui-app-shell';
import useUserMenu from '@/modules/user/features/settings/hooks/use-user-menu';
import type { UserMenuState } from '@/modules/user/features/settings/types/hooks/use-user-menu';

interface Harness {
  readonly menu: UserMenuState;
  readonly go: (to: string) => void;
}

interface KeyStub {
  readonly event: KeyboardEvent<HTMLButtonElement>;
  readonly preventDefault: jest.Mock;
}

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
);

const keyStub = (value: string): KeyStub => {
  const preventDefault = jest.fn();

  return {
    event: { key: value, preventDefault } as unknown as KeyboardEvent<HTMLButtonElement>,
    preventDefault,
  };
};

const renderMenu = (
  layout: ShellLayout
): ReturnType<typeof renderHook<Harness, { current: ShellLayout }>> =>
  renderHook(
    ({ current }: { current: ShellLayout }): Harness => {
      const navigate = useNavigate();

      return {
        menu: useUserMenu({ layout: current }),
        go: (to: string): void => void navigate(to),
      };
    },
    { wrapper, initialProps: { current: layout } }
  );

describe('useUserMenu', () => {
  it('starts closed and opens and closes on demand', () => {
    const { result } = renderMenu('desktop');

    expect(result.current.menu.open).toBe(false);
    act(() => result.current.menu.show());
    expect(result.current.menu.open).toBe(true);
    act(() => result.current.menu.close());
    expect(result.current.menu.open).toBe(false);
  });

  it('dismiss closes the menu and returns focus to the chip', () => {
    const { result } = renderMenu('desktop');
    const chip = document.createElement('button');
    document.body.append(chip);
    result.current.menu.chip.current = chip;
    act(() => result.current.menu.show());

    act(() => result.current.menu.dismiss());

    expect(result.current.menu.open).toBe(false);
    expect(chip).toHaveFocus();
    chip.remove();
  });

  it('opens on ArrowDown from the chip and stops the page from scrolling', () => {
    const { result } = renderMenu('tablet');
    const { event, preventDefault } = keyStub('ArrowDown');

    act(() => result.current.menu.chipKeyDown(event));

    expect(result.current.menu.open).toBe(true);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it.each(['Enter', ' ', 'ArrowUp', 'Escape', 'a'])('ignores %j on the chip', (value) => {
    const { result } = renderMenu('desktop');
    const { event, preventDefault } = keyStub(value);

    act(() => result.current.menu.chipKeyDown(event));

    expect(result.current.menu.open).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it.each(['Escape', 'Tab'])(
    'closes the open menu on %s and gives the focus to the chip',
    (value) => {
      const { result } = renderMenu('desktop');
      const chip = document.createElement('button');
      document.body.append(chip);
      result.current.menu.chip.current = chip;
      act(() => result.current.menu.show());

      act(() => result.current.menu.menuKeyDown(keyStub(value).event));

      expect(result.current.menu.open).toBe(false);
      expect(chip).toHaveFocus();
      chip.remove();
    }
  );

  it.each(['ArrowDown', 'Home', 'Enter', 'a'])('keeps the menu open on %s', (value) => {
    const { result } = renderMenu('desktop');
    act(() => result.current.menu.show());

    act(() => result.current.menu.menuKeyDown(keyStub(value).event));

    expect(result.current.menu.open).toBe(true);
  });

  it('closes when the route changes', () => {
    const { result } = renderMenu('desktop');
    act(() => result.current.menu.show());

    act(() => result.current.go('/settings'));

    expect(result.current.menu.open).toBe(false);
  });

  it('never commits the menu open on the new route', () => {
    const commits: string[] = [];
    const { result } = renderHook(
      (): Harness => {
        const navigate = useNavigate();
        const { pathname } = useLocation();
        const menu = useUserMenu({ layout: 'desktop' });
        useLayoutEffect(() => {
          commits.push(`${pathname} ${String(menu.open)}`);
        });

        return { menu, go: (to: string): void => void navigate(to) };
      },
      { wrapper }
    );
    act(() => result.current.menu.show());

    act(() => result.current.go('/settings'));

    expect(commits).toContain('/ true');
    expect(commits).not.toContain('/settings true');
    expect(commits.at(-1)).toBe('/settings false');
  });

  it('closes when the viewport crosses a layout boundary', () => {
    const { result, rerender } = renderMenu('mobile');
    act(() => result.current.menu.show());

    rerender({ current: 'tablet' });

    expect(result.current.menu.open).toBe(false);
  });

  it('stays open across an unrelated re-render', () => {
    const { result, rerender } = renderMenu('desktop');
    act(() => result.current.menu.show());

    rerender({ current: 'desktop' });

    expect(result.current.menu.open).toBe(true);
  });

  it('returns focus to the chip when a layout change closes the open menu and drops focus', () => {
    const { result, rerender } = renderMenu('desktop');
    const chip = document.createElement('button');
    document.body.append(chip);
    result.current.menu.chip.current = chip;
    act(() => result.current.menu.show());

    rerender({ current: 'mobile' });

    expect(result.current.menu.open).toBe(false);
    expect(chip).toHaveFocus();
    chip.remove();
  });

  it('returns focus to the chip again on every later layout change that closes the menu', () => {
    const { result, rerender } = renderMenu('desktop');
    const chip = document.createElement('button');
    document.body.append(chip);
    result.current.menu.chip.current = chip;
    act(() => result.current.menu.show());
    rerender({ current: 'mobile' });
    chip.blur();
    act(() => result.current.menu.show());

    rerender({ current: 'tablet' });

    expect(result.current.menu.open).toBe(false);
    expect(chip).toHaveFocus();
    chip.remove();
  });

  it('leaves focus on another element when a layout change closes the menu', () => {
    const { result, rerender } = renderMenu('tablet');
    const chip = document.createElement('button');
    const other = document.createElement('button');
    document.body.append(chip, other);
    result.current.menu.chip.current = chip;
    act(() => result.current.menu.show());
    other.focus();

    rerender({ current: 'desktop' });

    expect(result.current.menu.open).toBe(false);
    expect(other).toHaveFocus();
    chip.remove();
    other.remove();
  });

  it('does not focus the chip when the layout changes while the menu is closed', () => {
    const { result, rerender } = renderMenu('desktop');
    const chip = document.createElement('button');
    document.body.append(chip);
    result.current.menu.chip.current = chip;

    rerender({ current: 'mobile' });

    expect(chip).not.toHaveFocus();
    chip.remove();
  });

  it('keeps every handler stable across renders', () => {
    const { result, rerender } = renderMenu('desktop');
    const { show, close, dismiss, chipKeyDown, menuKeyDown } = result.current.menu;

    rerender({ current: 'desktop' });

    expect(result.current.menu).toMatchObject({ show, close, dismiss, chipKeyDown, menuKeyDown });
  });

  it('leaves focus alone when it mounts with the chip attached', () => {
    function ChipHarness(): JSX.Element {
      const menu = useUserMenu({ layout: 'desktop' });

      return (
        <button type="button" ref={menu.chip}>
          chip
        </button>
      );
    }
    render(<ChipHarness />, { wrapper });

    expect(screen.getByRole('button', { name: 'chip' })).not.toHaveFocus();
  });
});
