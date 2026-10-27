import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NavigationSidebarSignOut from '@/components/ui-navigation-list/navigation-sidebar-sign-out';
import renderShell from '@tests/unit/utils/render-shell';

describe('NavigationSidebarSignOut', () => {
  it.each([
    ['desktop', 'expanded', '100%'],
    ['desktop', 'rail', '74px'],
    ['tablet', 'rail', '96px'],
  ] as const)('draws the %s %s divider %s wide above Sign out', (layout, variant, width) => {
    renderShell(
      <ol>
        <NavigationSidebarSignOut layout={layout} variant={variant} onSignOut={jest.fn()} />
      </ol>
    );

    expect(screen.getByRole('separator', { hidden: true })).toHaveStyle({ width });
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it.each(['expanded', 'rail'] as const)(
    'runs the handler from the %s Sign out',
    async (variant) => {
      const user = userEvent.setup();
      const onSignOut = jest.fn();
      renderShell(
        <ol>
          <NavigationSidebarSignOut layout="desktop" variant={variant} onSignOut={onSignOut} />
        </ol>
      );

      await user.click(screen.getByRole('button', { name: 'Sign out' }));

      expect(onSignOut).toHaveBeenCalledTimes(1);
    }
  );
});
