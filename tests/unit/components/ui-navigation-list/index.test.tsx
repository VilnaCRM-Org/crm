import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type JSX, useCallback } from 'react';
import { Route, Routes, useNavigate } from 'react-router';

import navigationItems from '@/components/ui-app-shell/navigation-items';
import UINavigationList from '@/components/ui-navigation-list';
import featureFlagService from '@/config/runtime/feature-flag-service';
import renderShell from '@tests/unit/utils/render-shell';
import ShellLocation from '@tests/unit/utils/shell-location';

type ListProps = Parameters<typeof UINavigationList>[0];

function Harness(props: ListProps): JSX.Element {
  const navigate = useNavigate();
  const goHome = useCallback(() => navigate('/'), [navigate]);

  return (
    <>
      <UINavigationList
        layout={props.layout}
        variant={props.variant}
        items={props.items}
        signOut={props.signOut}
      />
      <button type="button" onClick={goHome}>
        go home
      </button>
      <ShellLocation />
    </>
  );
}

const renderList = (
  overrides: Partial<ListProps> = {},
  path = '/',
  locale: 'en' | 'uk' = 'en'
): ReturnType<typeof renderShell> =>
  renderShell(
    <Routes>
      <Route
        path="*"
        element={
          <Harness
            layout={overrides.layout ?? 'desktop'}
            variant={overrides.variant ?? 'expanded'}
            items={overrides.items ?? navigationItems}
            signOut={overrides.signOut ?? jest.fn()}
          />
        }
      />
    </Routes>,
    { path, locale }
  );

const linkTexts = (): (string | null)[] =>
  screen.getAllByRole('link').map((link) => link.textContent);

const currentLinks = (): (string | null)[] =>
  screen
    .getAllByRole('link')
    .filter((link) => link.hasAttribute('aria-current'))
    .map((link) => link.textContent);

describe('UINavigationList', () => {
  let isEnabled: jest.SpyInstance;

  beforeEach(() => {
    isEnabled = jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lists the products, then Settings, and ends with Sign out after a divider', () => {
    renderList();

    expect(linkTexts()).toEqual([
      'Boards',
      'Products',
      'Orders',
      'Contacts',
      'Analytics',
      'Settings',
    ]);
    const items = screen.getAllByRole('listitem');
    const last = items.at(-1) as HTMLElement;

    expect(within(last).getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(within(last).getByRole('separator', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    expect(screen.getAllByRole('list')).toHaveLength(1);
  });

  it.each([
    ['desktop', 'expanded'],
    ['desktop', 'rail'],
    ['tablet', 'expanded'],
    ['tablet', 'rail'],
  ] as const)(
    'keeps the scrolling %s %s list out of the Tab order and keeps its list role',
    (layout, variant) => {
      renderList({ layout, variant });

      const list = screen.getByRole('list');
      expect(list).toHaveAttribute('tabindex', '-1');
      expect(list).toHaveAttribute('role', 'list');
      expect(list).not.toHaveAttribute('aria-label');
    }
  );

  it('leaves the non-scrolling drawer list without a tabindex and keeps its list role', () => {
    renderList({ layout: 'drawer' });

    expect(screen.getByRole('list')).not.toHaveAttribute('tabindex');
    expect(screen.getByRole('list')).toHaveAttribute('role', 'list');
  });

  it('renders no Settings group and no sub-item while the userSettings flag is off', () => {
    isEnabled.mockReturnValue(false);

    renderList({}, '/settings');

    expect(linkTexts()).toEqual(['Boards', 'Products', 'Orders', 'Contacts', 'Analytics']);
    expect(screen.queryByRole('button', { name: /Settings/u })).not.toBeInTheDocument();
  });

  it.each(['/', '/boards', '/orders'])(
    'collapses the Settings group on %s: chevron closed and no sub-item',
    (path) => {
      renderList({}, path);

      expect(screen.getByRole('button', { name: 'Expand Settings' })).toHaveAttribute(
        'aria-expanded',
        'false'
      );
      expect(screen.queryByRole('link', { name: 'Integrations' })).not.toBeInTheDocument();
    }
  );

  it.each(['/settings', '/settings/webhooks'])(
    'expands the Settings group on %s with its three sub-items',
    (path) => {
      renderList({}, path);

      expect(screen.getByRole('button', { name: 'Collapse Settings' })).toHaveAttribute(
        'aria-expanded',
        'true'
      );
      expect(linkTexts().slice(-3)).toEqual(['Integrations', 'Webhooks', 'Billing']);
    }
  );

  it.each([
    ['/boards', 'Boards'],
    ['/products', 'Products'],
    ['/orders', 'Orders'],
    ['/contacts', 'Contacts'],
    ['/analytics', 'Analytics'],
    ['/settings', 'Settings'],
    ['/settings/', 'Settings'],
    ['/settings?x=1', 'Settings'],
    ['/settings/integrations', 'Integrations'],
    ['/settings/webhooks', 'Webhooks'],
    ['/settings/billing', 'Billing'],
  ])('marks %s and only %s current', (path, label) => {
    renderList({}, path);

    expect(currentLinks()).toEqual([label]);
  });

  it('marks nothing current on the home route', () => {
    renderList({}, '/');

    expect(currentLinks()).toEqual([]);
  });

  it('removes aria-current without a page reload when navigating to the home route', async () => {
    const user = userEvent.setup();
    renderList({}, '/settings');
    expect(currentLinks()).toEqual(['Settings']);

    await user.click(screen.getByRole('button', { name: 'go home' }));

    expect(currentLinks()).toEqual([]);
    expect(screen.getByLabelText('location')).toHaveTextContent('/|null');
  });

  it('navigates from a row with state.focusMain', async () => {
    const user = userEvent.setup();
    renderList({}, '/');

    await user.click(screen.getByRole('link', { name: 'Settings' }));

    expect(screen.getByLabelText('location')).toHaveTextContent('/settings|{"focusMain":true}');
    expect(currentLinks()).toEqual(['Settings']);
    expect(linkTexts().slice(-3)).toEqual(['Integrations', 'Webhooks', 'Billing']);
  });

  it('toggles the group from the chevron, then follows the route rule', async () => {
    const user = userEvent.setup();
    renderList({}, '/boards');

    await user.click(screen.getByRole('button', { name: 'Expand Settings' }));

    expect(screen.getByRole('link', { name: 'Billing' })).toBeInTheDocument();
    expect(screen.getByLabelText('location')).toHaveTextContent('/boards|null');

    await user.click(screen.getByRole('link', { name: 'Orders' }));

    expect(screen.queryByRole('link', { name: 'Billing' })).not.toBeInTheDocument();
  });

  it('calls signOut exactly once, however often Sign out is activated', async () => {
    const user = userEvent.setup();
    const signOut = jest.fn();
    renderList({ signOut });

    const signOutButton = screen.getByRole('button', { name: 'Sign out' });
    await user.click(signOutButton);
    await user.click(signOutButton);
    await user.dblClick(signOutButton);
    signOutButton.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('keeps the rest in order and leaves no gap when an item is filtered out of the set', () => {
    renderList({ items: { items: navigationItems.items.filter(({ id }) => id !== 'products') } });

    expect(linkTexts()).toEqual(['Boards', 'Orders', 'Contacts', 'Analytics', 'Settings']);
  });

  it('renders the rail as one list of top-level icon rows and sign out, with no chevron', () => {
    renderList({ variant: 'rail' }, '/settings');

    expect(linkTexts()).toEqual([
      'Boards',
      'Products',
      'Orders',
      'Contacts',
      'Analytics',
      'Settings',
      'Integrations',
      'Webhooks',
      'Billing',
    ]);
    expect(screen.queryByRole('button', { name: /Settings/u })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(currentLinks()).toEqual(['Settings']);
  });

  it('calls signOut once from the rail as well', async () => {
    const user = userEvent.setup();
    const signOut = jest.fn();
    renderList({ variant: 'rail', layout: 'tablet', signOut });

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('shows no Not available yet status on any row', () => {
    renderList({}, '/settings');

    expect(screen.queryByText('Not available yet')).not.toBeInTheDocument();
    expect(screen.queryByText('Ще недоступно')).not.toBeInTheDocument();
  });
});

describe('UINavigationList in the drawer', () => {
  beforeEach(() => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lists the same rows without a divider: Sign out carries its own top border', () => {
    renderList({ layout: 'drawer' }, '/');

    expect(linkTexts()).toEqual([
      'Boards',
      'Products',
      'Orders',
      'Contacts',
      'Analytics',
      'Settings',
    ]);
    expect(screen.queryByRole('separator', { hidden: true })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toHaveStyle({
      minHeight: '54px',
      borderTop: '1px solid #E1E7EA',
    });
  });

  it('draws 60 px rows, a 48 px open Settings header and a 60 px collapsed one', () => {
    const { unmount } = renderList({ layout: 'drawer' }, '/settings');

    expect(screen.getByRole('link', { name: 'Boards' })).toHaveStyle({ minHeight: '60px' });
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveStyle({ minHeight: '48px' });
    expect(screen.getByRole('link', { name: 'Integrations' })).toHaveStyle({ minHeight: '42px' });
    unmount();

    renderList({ layout: 'drawer' }, '/');

    expect(screen.getByRole('link', { name: 'Settings' })).toHaveStyle({ minHeight: '60px' });
  });

  it('calls signOut once and keeps working the Settings chevron like the sidebar', async () => {
    const user = userEvent.setup();
    const signOut = jest.fn();
    renderList({ layout: 'drawer', signOut }, '/boards');

    await user.click(screen.getByRole('button', { name: 'Expand Settings' }));
    expect(screen.getByRole('link', { name: 'Billing' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
