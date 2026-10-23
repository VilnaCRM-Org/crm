import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';

import type { NavigationGroup as Group } from '@/components/types/ui-app-shell/navigation-item';
import NavigationGroup from '@/components/ui-navigation-list/navigation-group';
import renderShell from '@tests/unit/utils/render-shell';
import ShellLocation from '@tests/unit/utils/shell-location';

const icon = 'svg' as unknown as Group['icon'];

const group: Group = {
  id: 'settings',
  href: '/settings',
  labelKey: 'app_shell.items.settings',
  icon,
  children: {
    items: [
      {
        id: 'integrations',
        href: '/settings/integrations',
        labelKey: 'app_shell.items.integrations',
        icon,
      },
      { id: 'webhooks', href: '/settings/webhooks', labelKey: 'app_shell.items.webhooks', icon },
      { id: 'billing', href: '/settings/billing', labelKey: 'app_shell.items.billing', icon },
    ],
  },
};

const renderGroup = (
  path: string,
  currentId: 'settings' | null = null
): ReturnType<typeof renderShell> =>
  renderShell(
    <Routes>
      <Route
        path="*"
        element={
          <>
            <ul>
              <NavigationGroup layout="desktop" group={group} currentId={currentId} />
            </ul>
            <ShellLocation />
          </>
        }
      />
    </Routes>,
    { path }
  );

describe('NavigationGroup', () => {
  it('is collapsed outside settings: the header link only, no sub-item in the DOM', () => {
    renderGroup('/boards');

    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
    expect(screen.getByRole('button', { name: 'Expand Settings' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByRole('link', { name: 'Integrations' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Webhooks' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Billing' })).not.toBeInTheDocument();
  });

  it.each(['/settings', '/settings/webhooks'])(
    'is expanded on %s with its three sub-items',
    (path) => {
      renderGroup(path);

      expect(screen.getByRole('button', { name: 'Collapse Settings' })).toHaveAttribute(
        'aria-expanded',
        'true'
      );
      expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
        'Settings',
        'Integrations',
        'Webhooks',
        'Billing',
      ]);
    }
  );

  it('points aria-controls at the id of the sub-item list while expanded', () => {
    renderGroup('/settings');

    const list = screen.getAllByRole('list')[1];

    expect(screen.getByRole('button', { name: 'Collapse Settings' })).toHaveAttribute(
      'aria-controls',
      list?.getAttribute('id')
    );
  });

  it('toggles on the chevron without navigating and keeps focus on it', async () => {
    const user = userEvent.setup();
    renderGroup('/boards');

    await user.click(screen.getByRole('button', { name: 'Expand Settings' }));

    expect(screen.getByRole('link', { name: 'Integrations' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse Settings' })).toHaveFocus();
    expect(screen.getByLabelText('location')).toHaveTextContent('/boards|null');

    await user.keyboard('{Enter}');

    expect(screen.queryByRole('link', { name: 'Integrations' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('location')).toHaveTextContent('/boards|null');
  });

  it('navigates on the Settings link and leaves the group state to the route rule', async () => {
    const user = userEvent.setup();
    renderGroup('/boards');

    await user.click(screen.getByRole('link', { name: 'Settings' }));

    expect(screen.getByLabelText('location')).toHaveTextContent('/settings|{"focusMain":true}');
    expect(screen.getByRole('button', { name: 'Collapse Settings' })).toBeInTheDocument();
  });

  it('marks only the Settings header link current on the settings page', () => {
    renderGroup('/settings', 'settings');

    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Billing' })).not.toHaveAttribute('aria-current');
  });

  it('sizes the expanded group to the Figma 192 px and the collapsed one to its header row', () => {
    renderGroup('/settings');
    expect(screen.getAllByRole('listitem')[0]).toHaveStyle({ paddingBottom: '12px' });
  });

  it('collapsed group has no bottom padding', () => {
    renderGroup('/boards');

    expect(screen.getAllByRole('listitem')[0]).toHaveStyle({ paddingBottom: '0px' });
  });
});
