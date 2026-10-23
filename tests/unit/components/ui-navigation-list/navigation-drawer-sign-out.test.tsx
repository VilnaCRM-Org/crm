import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NavigationDrawerSignOut from '@/components/ui-navigation-list/navigation-drawer-sign-out';
import renderShell from '@tests/unit/utils/render-shell';

describe('NavigationDrawerSignOut', () => {
  it('renders a Sign out button with its own top border and no divider', () => {
    renderShell(
      <ol>
        <NavigationDrawerSignOut onSignOut={jest.fn()} />
      </ol>
    );

    expect(screen.getByRole('button', { name: 'Sign out' })).toHaveStyle({
      height: '54px',
      borderTop: '1px solid #E1E7EA',
    });
    expect(screen.queryByRole('separator', { hidden: true })).not.toBeInTheDocument();
  });

  it('runs the handler on click', async () => {
    const user = userEvent.setup();
    const onSignOut = jest.fn();
    renderShell(
      <ol>
        <NavigationDrawerSignOut onSignOut={onSignOut} />
      </ol>
    );

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('reads in uk', () => {
    renderShell(
      <ol>
        <NavigationDrawerSignOut onSignOut={jest.fn()} />
      </ol>,
      { locale: 'uk' }
    );

    expect(screen.getByRole('button', { name: 'Вийти' })).toBeInTheDocument();
  });
});
