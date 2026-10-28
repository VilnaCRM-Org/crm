import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement, useCallback } from 'react';
import { Route, Routes, useNavigate } from 'react-router';

import navigationItems from '@/components/ui-app-shell/navigation-items';
import DrawerPanel from '@/components/ui-navigation-drawer/drawer-panel';
import featureFlagService from '@/config/runtime/feature-flag-service';
import renderShell from '@tests/unit/utils/render-shell';

function Probe({ onNavigate }: { onNavigate: () => void }): ReactElement {
  const navigate = useNavigate();
  const goBoards = useCallback(() => navigate('/boards'), [navigate]);

  return (
    <>
      <DrawerPanel items={navigationItems} signOut={jest.fn()} onNavigate={onNavigate} />
      <button type="button" onClick={goBoards}>
        go
      </button>
    </>
  );
}

const renderPanel = (onNavigate = jest.fn(), path = '/'): ReturnType<typeof renderShell> =>
  renderShell(
    <Routes>
      <Route path="*" element={<Probe onNavigate={onNavigate} />} />
    </Routes>,
    { path }
  );

describe('DrawerPanel', () => {
  beforeEach(() => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the disabled search above one navigation named Main navigation', () => {
    renderPanel();

    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeDisabled();
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveAccessibleDescription(
      'Not available yet'
    );
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('lists the same rows as the sidebar, in the 60 px drawer rows, ending with Sign out', () => {
    renderPanel();

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Boards',
      'Products',
      'Orders',
      'Contacts',
      'Analytics',
      'Settings',
    ]);
    expect(screen.getByRole('link', { name: 'Boards' })).toHaveStyle({ minHeight: '60px' });
    expect(screen.getAllByRole('listitem')[0]).toHaveStyle({ width: '233px' });
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('asks to close when the route changes, and not before', async () => {
    const user = userEvent.setup();
    const onNavigate = jest.fn();
    renderPanel(onNavigate);
    expect(onNavigate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'go' }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('closes and signs out through the latest callbacks after they change', async () => {
    const user = userEvent.setup();
    const first = { onNavigate: jest.fn(), signOut: jest.fn() };
    const second = { onNavigate: jest.fn(), signOut: jest.fn() };
    const view = renderShell(
      <DrawerPanel items={navigationItems} signOut={first.signOut} onNavigate={first.onNavigate} />
    );

    view.rerender(
      <DrawerPanel
        items={navigationItems}
        signOut={second.signOut}
        onNavigate={second.onNavigate}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(first.onNavigate).not.toHaveBeenCalled();
    expect(first.signOut).not.toHaveBeenCalled();
    expect(second.onNavigate).toHaveBeenCalledTimes(1);
    expect(second.signOut).toHaveBeenCalledTimes(1);
  });
});
