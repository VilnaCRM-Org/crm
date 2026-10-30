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

    const divider = screen.getByRole('separator', { hidden: true });

    expect(divider).toHaveStyle({ width });
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(
      divider.compareDocumentPosition(screen.getByRole('button', { name: 'Sign out' })) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
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
