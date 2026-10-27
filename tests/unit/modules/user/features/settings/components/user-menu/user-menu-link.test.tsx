import '@testing-library/jest-dom';
import MenuList from '@mui/material/MenuList';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';

import UserMenuLink from '@/modules/user/features/settings/components/user-menu/user-menu-link';
import { styleRuleFor } from '@tests/unit/utils/emotion-style-rules';
import renderShell from '@tests/unit/utils/render-shell';
import ShellLocation from '@tests/unit/utils/shell-location';

const renderLink = (onClose = jest.fn(), layout: 'desktop' | 'tablet' = 'desktop'): void => {
  renderShell(
    <Routes>
      <Route
        path="*"
        element={
          <>
            <MenuList>
              <UserMenuLink layout={layout} label="Settings" onClose={onClose} />
            </MenuList>
            <ShellLocation />
          </>
        }
      />
    </Routes>,
    { path: '/boards' }
  );
};

describe('UserMenuLink', () => {
  it('is a menu item link to /settings', () => {
    renderLink();

    expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveAttribute('href', '/settings');
  });

  it('keeps its label colour once visited, over the global a:visited', () => {
    renderLink();

    const link = screen.getByRole('menuitem', { name: 'Settings' });

    expect(styleRuleFor(link, ':visited')?.color).toBe('#1A1C1E');
  });

  it('closes the menu and navigates with state.focusMain when activated', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderLink(onClose);

    await user.click(screen.getByRole('menuitem', { name: 'Settings' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('location')).toHaveTextContent('/settings|{"focusMain":true}');
  });

  it('activates once on Space, as on click', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderLink(onClose);
    act(() => screen.getByRole('menuitem', { name: 'Settings' }).focus());

    await user.keyboard(' ');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('location')).toHaveTextContent('/settings|{"focusMain":true}');
  });

  it('leaves other keys to the menu', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderLink(onClose);
    act(() => screen.getByRole('menuitem', { name: 'Settings' }).focus());

    await user.keyboard('a');

    expect(onClose).not.toHaveBeenCalled();
  });

  it.each([
    ['desktop', '44px', '14px'],
    ['tablet', '60px', '16px'],
  ] as const)('draws the %s item %s tall in %s Inter', (layout, height, fontSize) => {
    renderLink(jest.fn(), layout);

    expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveStyle({
      height,
      fontSize,
      paddingLeft: '20px',
      color: '#1A1C1E',
    });
  });
});
