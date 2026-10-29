import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UserChip from '@/modules/user/features/settings/components/user-menu/user-chip';
import buildUserMenuState from '@tests/unit/utils/build-user-menu-state';
import renderShell from '@tests/unit/utils/render-shell';

const identity = { displayName: 'Anna Koval', monogram: 'AK' };

describe('UserChip', () => {
  it.each([
    ['desktop', '14px', '121px', '46px'],
    ['tablet', '16px', '138px', '50px'],
  ] as const)(
    'draws the %s chip: name %s in a box at least %s wide, %s tall',
    (layout, fontSize, minWidth, height) => {
      renderShell(
        <UserChip layout={layout} identity={identity} menu={buildUserMenuState()} menuId="m" />
      );

      expect(screen.getByText('Anna Koval')).toHaveStyle({
        fontSize,
        minWidth,
        lineHeight: '18px',
      });
      expect(screen.getByRole('button')).toHaveStyle({ height });
    }
  );

  it('is a menu button: collapsed without aria-controls, expanded with it', () => {
    const { rerender } = renderShell(
      <UserChip layout="desktop" identity={identity} menu={buildUserMenuState()} menuId="m" />
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-controls');

    rerender(
      <UserChip
        layout="desktop"
        identity={identity}
        menu={buildUserMenuState({ open: true })}
        menuId="m"
      />
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'm');
  });

  it('names the chip by the display name and the localized User menu, or User menu alone', () => {
    const { rerender } = renderShell(
      <UserChip layout="desktop" identity={identity} menu={buildUserMenuState()} menuId="m" />
    );
    expect(screen.getByRole('button')).toHaveAccessibleName('Anna Koval, User menu');

    rerender(<UserChip layout="desktop" identity={null} menu={buildUserMenuState()} menuId="m" />);
    expect(screen.getByRole('button')).toHaveAccessibleName('User menu');
  });

  it('names an empty display name like a name-less chip', () => {
    renderShell(
      <UserChip
        layout="desktop"
        identity={{ displayName: '', monogram: '' }}
        menu={buildUserMenuState()}
        menuId="m"
      />
    );

    expect(screen.getByRole('button')).toHaveAccessibleName('User menu');
  });

  it('holds the menu ref, opens through show, closes through dismiss, forwards keys', async () => {
    const user = userEvent.setup();
    const closed = buildUserMenuState();
    const { rerender } = renderShell(
      <UserChip layout="mobile" identity={identity} menu={closed} menuId="m" />
    );

    await user.click(screen.getByRole('button'));
    await user.keyboard('{ArrowDown}');

    expect(closed.chip.current).toBe(screen.getByRole('button'));
    expect(closed.show).toHaveBeenCalledTimes(1);
    expect(closed.dismiss).not.toHaveBeenCalled();
    expect(closed.chipKeyDown).toHaveBeenCalledTimes(1);

    const open = buildUserMenuState({ open: true });
    rerender(<UserChip layout="mobile" identity={identity} menu={open} menuId="m" />);
    await user.click(screen.getByRole('button'));

    expect(open.dismiss).toHaveBeenCalledTimes(1);
    expect(open.show).not.toHaveBeenCalled();
  });

  it('is the 40 px avatar alone on mobile: no name, no caret, a 44 px target', () => {
    const { container } = renderShell(
      <UserChip layout="mobile" identity={identity} menu={buildUserMenuState()} menuId="m" />
    );

    expect(screen.queryByText('Anna Koval')).not.toBeInTheDocument();
    expect(container).not.toContainHTML('focusable="false"');
    expect(screen.getByRole('button')).toHaveStyle({ width: '44px', height: '44px' });
    expect(screen.getByText('AK')).toHaveStyle({ width: '40px', height: '40px' });
  });

  it('draws an empty avatar on mobile when the identity is unknown', () => {
    renderShell(
      <UserChip layout="mobile" identity={null} menu={buildUserMenuState()} menuId="m" />
    );

    expect(screen.getByRole('button')).toHaveAccessibleName('User menu');
    expect(screen.getByRole('button')).toHaveStyle({ width: '44px', height: '44px' });
  });

  it('keeps the caret decorative whether the menu is open or not', () => {
    const { container, rerender } = renderShell(
      <UserChip layout="desktop" identity={identity} menu={buildUserMenuState()} menuId="m" />
    );
    expect(container).toContainHTML('aria-hidden="true" focusable="false"');

    rerender(
      <UserChip
        layout="desktop"
        identity={identity}
        menu={buildUserMenuState({ open: true })}
        menuId="m"
      />
    );

    expect(container).toContainHTML('aria-hidden="true" focusable="false"');
  });

  it('keeps the mobile avatar above the backdrop of the open menu', () => {
    renderShell(
      <UserChip layout="mobile" identity={identity} menu={buildUserMenuState()} menuId="m" />
    );

    expect(screen.getByRole('button')).toHaveStyle({ zIndex: '2' });
  });
});
