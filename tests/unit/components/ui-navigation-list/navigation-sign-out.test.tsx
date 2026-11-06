import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import NavigationSignOut from '@/components/ui-navigation-list/navigation-sign-out';
import renderShell from '@tests/unit/utils/render-shell';

const inList = (ui: ReactElement): ReactElement => <ol>{ui}</ol>;

describe('NavigationSignOut', () => {
  it.each(['desktop', 'tablet'] as const)(
    'renders the %s expanded Sign out button after a decorative divider',
    (layout) => {
      renderShell(
        inList(<NavigationSignOut layout={layout} variant="expanded" onSignOut={jest.fn()} />)
      );

      expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
      expect(screen.queryByRole('separator')).not.toBeInTheDocument();
      expect(screen.getByRole('separator', { hidden: true })).toHaveStyle({ height: '1px' });
    }
  );

  it.each([
    ['desktop', '74px'],
    ['tablet', '96px'],
  ] as const)('draws the %s rail divider %s wide, as Figma draws it', (layout, width) => {
    renderShell(inList(<NavigationSignOut layout={layout} variant="rail" onSignOut={jest.fn()} />));

    expect(screen.getByRole('separator', { hidden: true })).toHaveStyle({ width });
  });

  it('draws the expanded divider across the whole panel', () => {
    renderShell(
      inList(<NavigationSignOut layout="desktop" variant="expanded" onSignOut={jest.fn()} />)
    );

    expect(screen.getByRole('separator', { hidden: true })).toHaveStyle({ width: '100%' });
  });

  it('runs the handler on click, Enter and Space in the expanded list', async () => {
    const user = userEvent.setup();
    const onSignOut = jest.fn();
    renderShell(
      inList(<NavigationSignOut layout="desktop" variant="expanded" onSignOut={onSignOut} />)
    );

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onSignOut).toHaveBeenCalledTimes(3);
  });

  it('renders the rail Sign out as a button that runs the handler', async () => {
    const user = userEvent.setup();
    const onSignOut = jest.fn();
    renderShell(inList(<NavigationSignOut layout="tablet" variant="rail" onSignOut={onSignOut} />));

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('reads in uk', () => {
    renderShell(
      inList(<NavigationSignOut layout="desktop" variant="expanded" onSignOut={jest.fn()} />),
      {
        locale: 'uk',
      }
    );

    expect(screen.getByRole('button', { name: 'Вийти' })).toBeInTheDocument();
  });
});
