import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UserMenuItems from '@/modules/user/features/settings/components/user-menu/user-menu-items';
import buildUserMenuState from '@tests/unit/utils/build-user-menu-state';
import renderShell from '@tests/unit/utils/render-shell';

type Props = Parameters<typeof UserMenuItems>[0];

const DIVIDER = { borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#E1E7EA' };
const ROUNDED = { borderRadius: '0 0 7px 7px' };

const renderItems = (props: Partial<Props> = {}, locale: 'en' | 'uk' = 'en'): void => {
  renderShell(
    <UserMenuItems
      layout={props.layout ?? 'desktop'}
      menuId="user-menu"
      settingsAvailable={props.settingsAvailable ?? true}
      menu={props.menu ?? buildUserMenuState({ open: true })}
      signOut={props.signOut ?? jest.fn()}
    />,
    { locale }
  );
};

describe('UserMenuItems', () => {
  it('is a menu named User menu with My profile, Settings and Sign out', () => {
    renderItems();

    expect(screen.getByRole('menu', { name: 'User menu' })).toHaveAttribute('id', 'user-menu');
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'My profile',
      'Settings',
      'Sign out',
    ]);
  });

  it('holds Sign out alone while settings are unavailable', () => {
    renderItems({ settingsAvailable: false });

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Sign out']);
  });

  it('speaks uk', () => {
    renderItems({}, 'uk');

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Мій профіль',
      'Налаштування',
      'Вийти',
    ]);
  });

  it('focuses the first item when it mounts', () => {
    renderItems();

    expect(screen.getAllByRole('menuitem')[0]).toHaveFocus();
  });

  it('closes the menu and signs out when Sign out is activated', async () => {
    const user = userEvent.setup();
    const menu = buildUserMenuState({ open: true });
    const signOut = jest.fn();
    renderItems({ menu, signOut });

    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(menu.close).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('forwards key presses to the menu handler', async () => {
    const user = userEvent.setup();
    const menu = buildUserMenuState({ open: true });
    renderItems({ menu });

    await user.keyboard('{Escape}');

    expect(menu.menuKeyDown).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['desktop', '44px'],
    ['tablet', '60px'],
    ['mobile', '44px'],
  ] as const)('sizes the %s items to %s', (layout, height) => {
    renderItems({ layout });

    screen.getAllByRole('menuitem').forEach((item) => expect(item).toHaveStyle({ height }));
  });

  it.each(['desktop', 'tablet'] as const)(
    'draws the #E1E7EA divider on the first %s item and rounds the last one',
    (layout) => {
      renderItems({ layout });
      const [profile, settings, signOut] = screen.getAllByRole('menuitem');

      expect(profile).toHaveStyle(DIVIDER);
      expect(settings).not.toHaveStyle(DIVIDER);
      expect(signOut).not.toHaveStyle(DIVIDER);
      expect(signOut).toHaveStyle(ROUNDED);
      expect(profile).not.toHaveStyle(ROUNDED);
      expect(settings).not.toHaveStyle(ROUNDED);
    }
  );

  it.each(['desktop', 'tablet'] as const)(
    'gives the lone %s Sign out both the divider and the rounded corners',
    (layout) => {
      renderItems({ layout, settingsAvailable: false });

      expect(screen.getByRole('menuitem', { name: 'Sign out' })).toHaveStyle({
        ...DIVIDER,
        ...ROUNDED,
      });
    }
  );

  it('draws no divider and no rounded item in the mobile popover', () => {
    renderItems({ layout: 'mobile' });

    screen.getAllByRole('menuitem').forEach((item) => {
      expect(item).not.toHaveStyle(DIVIDER);
      expect(item).not.toHaveStyle(ROUNDED);
    });
  });
});
