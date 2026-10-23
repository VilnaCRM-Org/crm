import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { NavigationIcon } from '@/components/types/ui-app-shell/navigation-item';
import NavigationRailItem from '@/components/ui-navigation-list/navigation-rail-item';
import renderShell from '@tests/unit/utils/render-shell';

const icon = 'svg' as unknown as NavigationIcon;

describe('NavigationRailItem', () => {
  it('renders the row as a link named by its label, with no tooltip at rest', () => {
    renderShell(
      <NavigationRailItem layout="desktop" id="boards" label="Boards" icon={icon} href="/boards" />
    );

    expect(screen.getByRole('link', { name: 'Boards' })).toHaveAttribute('href', '/boards');
    expect(screen.getAllByText('Boards')).toHaveLength(1);
  });

  it('shows the tooltip on hover and hides it when the pointer leaves', async () => {
    const user = userEvent.setup();
    renderShell(
      <NavigationRailItem layout="desktop" id="boards" label="Boards" icon={icon} href="/boards" />
    );

    await user.hover(screen.getByRole('link', { name: 'Boards' }));
    expect(screen.getAllByText('Boards')).toHaveLength(2);

    await user.unhover(screen.getByRole('link', { name: 'Boards' }));
    expect(screen.getAllByText('Boards')).toHaveLength(1);
  });

  it('shows the tooltip on keyboard focus and Escape hides it without moving focus', async () => {
    const user = userEvent.setup();
    renderShell(
      <NavigationRailItem layout="desktop" id="boards" label="Boards" icon={icon} href="/boards" />
    );

    await user.tab();
    expect(screen.getAllByText('Boards')).toHaveLength(2);

    await user.keyboard('{Escape}');

    expect(screen.getAllByText('Boards')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Boards' })).toHaveFocus();
  });

  it('keeps the tooltip inside the hover region of its row', async () => {
    const user = userEvent.setup();
    renderShell(
      <NavigationRailItem layout="desktop" id="boards" label="Boards" icon={icon} href="/boards" />
    );

    await user.hover(screen.getByRole('link', { name: 'Boards' }));

    const region = screen.getAllByRole('generic', { hidden: true })[1] as HTMLElement;

    expect(within(region).getAllByText('Boards')).toHaveLength(2);
  });

  it('behaves as an action row for sign out: one call per activation', async () => {
    const user = userEvent.setup();
    const onActivate = jest.fn();
    renderShell(
      <NavigationRailItem
        layout="tablet"
        id="signOut"
        label="Sign out"
        icon={icon}
        onActivate={onActivate}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['desktop', 'boards', '54px', '40px'],
    ['tablet', 'boards', '66px', '44px'],
    ['tablet', 'products', '67px', '44px'],
    ['tablet', 'integrations', '66px', '40px'],
    ['tablet', 'signOut', '54px', '40px'],
  ] as const)('sizes the %s %s item: wrapper %s, pill %s', (layout, id, wrapper, pill) => {
    renderShell(<NavigationRailItem layout={layout} id={id} label="Row" icon={icon} href="/row" />);

    expect(screen.getByRole('link', { name: 'Row' })).toHaveStyle({ height: pill });
    expect(screen.getAllByRole('generic', { hidden: true })[1]).toHaveStyle({ height: wrapper });
  });

  it('marks the current rail row', () => {
    renderShell(
      <NavigationRailItem
        layout="desktop"
        id="boards"
        label="Boards"
        icon={icon}
        href="/b"
        current
      />
    );

    expect(screen.getByRole('link', { name: 'Boards' })).toHaveAttribute('aria-current', 'page');
  });
});
