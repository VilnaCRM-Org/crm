import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactElement, SVGProps } from 'react';
import { Route, Routes } from 'react-router';

import type { NavigationIcon } from '@/components/types/ui-app-shell/navigation-item';
import NavigationRow from '@/components/ui-navigation-list/navigation-row';
import { styleRuleFor } from '@tests/unit/utils/emotion-style-rules';
import renderShell from '@tests/unit/utils/render-shell';
import ShellLocation from '@tests/unit/utils/shell-location';

const icon = 'svg' as unknown as NavigationIcon;

function RoleIcon({ className, 'aria-hidden': hidden }: SVGProps<SVGSVGElement>): JSX.Element {
  return <svg role="img" aria-label="icon" aria-hidden={hidden} className={className} />;
}

const renderRow = (ui: ReactElement, path = '/'): ReturnType<typeof renderShell> =>
  renderShell(
    <Routes>
      <Route
        path="*"
        element={
          <>
            {ui}
            <ShellLocation />
          </>
        }
      />
    </Routes>,
    { path }
  );

describe('NavigationRow', () => {
  it('renders a product row as a link with its label and a decorative icon', () => {
    renderRow(
      <NavigationRow
        layout="desktop"
        variant="item"
        id="boards"
        label="Boards"
        icon={icon}
        href="/boards"
      />
    );

    const link = screen.getByRole('link', { name: 'Boards' });

    expect(link).toHaveAttribute('href', '/boards');
    expect(link).toContainHTML('aria-hidden="true"');
    expect(link).not.toHaveAttribute('aria-current');
    expect(link).not.toHaveAttribute('aria-disabled');
    expect(screen.queryByText('Not available yet')).not.toBeInTheDocument();
  });

  it('keeps the label colour on a visited row, over the global a:visited', () => {
    renderRow(
      <NavigationRow
        layout="desktop"
        variant="item"
        id="boards"
        label="Boards"
        icon={icon}
        href="/boards"
      />
    );

    const link = screen.getByRole('link', { name: 'Boards' });

    expect(styleRuleFor(link, ':visited')?.color).toBe('#404142');
  });

  it('marks the current row with aria-current="page" and nothing else', () => {
    renderRow(
      <NavigationRow
        layout="desktop"
        variant="item"
        id="boards"
        label="Boards"
        icon={icon}
        href="/boards"
        current
      />
    );

    expect(screen.getByRole('link', { name: 'Boards' })).toHaveAttribute('aria-current', 'page');
  });

  it('wraps the label of a group header in a box that keeps clear of the chevron', () => {
    renderRow(
      <NavigationRow
        layout="tablet"
        variant="item"
        id="settings"
        label="Settings"
        icon={icon}
        href="/settings"
        grouped
      />
    );

    const label = screen.getByText('Settings');

    expect(label.tagName).toBe('SPAN');
    expect(screen.getByRole('link', { name: 'Settings' })).toContainElement(label);
    expect(label).toHaveStyle({ maxWidth: '131px', overflowWrap: 'anywhere' });
  });

  it('leaves the label of an ungrouped row as plain link text', () => {
    renderRow(
      <NavigationRow
        layout="tablet"
        variant="item"
        id="boards"
        label="Boards"
        icon={icon}
        href="/boards"
      />
    );

    expect(screen.getByText('Boards')).toBe(screen.getByRole('link', { name: 'Boards' }));
  });

  it('navigates without a document load and asks the page to focus main, on click', async () => {
    const user = userEvent.setup();
    renderRow(
      <NavigationRow
        layout="desktop"
        variant="item"
        id="boards"
        label="Boards"
        icon={icon}
        href="/boards"
      />
    );

    await user.click(screen.getByRole('link', { name: 'Boards' }));

    expect(screen.getByLabelText('location')).toHaveTextContent('/boards|{"focusMain":true}');
  });

  it('navigates on Enter as well', async () => {
    const user = userEvent.setup();
    renderRow(
      <NavigationRow
        layout="tablet"
        variant="sub"
        id="billing"
        label="Billing"
        href="/settings/billing"
      />
    );

    await user.tab();
    await user.keyboard('{Enter}');

    expect(screen.getByLabelText('location')).toHaveTextContent(
      '/settings/billing|{"focusMain":true}'
    );
  });

  it('renders an action row as a button that runs its handler once per activation', async () => {
    const user = userEvent.setup();
    const onActivate = jest.fn();
    renderRow(
      <NavigationRow
        layout="desktop"
        variant="item"
        id="signOut"
        label="Sign out"
        icon={icon}
        onActivate={onActivate}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onActivate).toHaveBeenCalledTimes(3);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByLabelText('location')).toHaveTextContent('/|null');
  });

  it('renders a sub-item as a link without an icon', () => {
    renderRow(
      <NavigationRow
        layout="desktop"
        variant="sub"
        id="integrations"
        label="Integrations"
        href="/settings/integrations"
      />
    );

    expect(screen.getByRole('link', { name: 'Integrations' })).not.toContainHTML('aria-hidden');
  });

  it('keeps the label of a rail row as hidden accessible text next to its icon', () => {
    renderRow(
      <NavigationRow
        layout="desktop"
        variant="rail"
        id="boards"
        label="Boards"
        icon={icon}
        href="/boards"
      />
    );

    const link = screen.getByRole('link', { name: 'Boards' });

    expect(link).toContainHTML('aria-hidden="true"');
    expect(screen.getByText('Boards')).toHaveStyle({ width: '1px', height: '1px' });
  });

  it.each([
    ['desktop', 'products', '54px'],
    ['tablet', 'boards', '66px'],
    ['tablet', 'products', '67px'],
    ['tablet', 'settings', '66px'],
  ] as const)('sizes the %s %s row to %s', (layout, id, height) => {
    renderRow(
      <NavigationRow layout={layout} variant="item" id={id} label="Row" icon={icon} href="/x" />
    );

    expect(screen.getByRole('link', { name: 'Row' })).toHaveStyle({ minHeight: height });
  });

  it('sizes the sign out row to 54 px on the tablet layout too', () => {
    renderRow(
      <NavigationRow
        layout="tablet"
        variant="item"
        id="signOut"
        label="Sign out"
        icon={icon}
        onActivate={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Sign out' })).toHaveStyle({
      minHeight: '54px',
      fontSize: '16px',
    });
  });

  it.each([
    ['desktop', undefined, '56px', '40px'],
    ['tablet', 'tablet', '60px', '44px'],
    ['tablet', 'tabletProducts', '60px', '44px'],
    ['tablet', 'tabletCompact', '56px', '40px'],
    ['tablet', 'action', '56px', '40px'],
  ] as const)('draws the %s %s rail pill at %s by %s', (layout, shape, width, height) => {
    renderRow(
      <NavigationRow
        layout={layout}
        variant="rail"
        shape={shape}
        id="boards"
        label="Row"
        icon={icon}
        href="/x"
      />
    );

    expect(screen.getByRole('link', { name: 'Row' })).toHaveStyle({ width, height });
  });

  it('renders no MUI ripple inside the row', () => {
    const { container } = renderRow(
      <NavigationRow layout="desktop" variant="item" id="boards" label="Boards" href="/boards" />
    );

    expect(container).not.toContainHTML('MuiTouchRipple');
  });

  it('draws the tablet sign out icon at the 24 px action size', () => {
    renderRow(
      <NavigationRow
        layout="tablet"
        variant="item"
        id="signOut"
        label="Sign out"
        icon={RoleIcon}
        onActivate={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Sign out' })).toContainElement(
      screen.getByRole('img', { hidden: true })
    );
    expect(screen.getByRole('img', { hidden: true })).toHaveStyle({
      width: '24px',
      height: '24px',
    });
  });

  it('draws a tablet product icon at the 28 px tablet size', () => {
    renderRow(
      <NavigationRow
        layout="tablet"
        variant="item"
        id="boards"
        label="Boards"
        icon={RoleIcon}
        href="/boards"
      />
    );

    expect(screen.getByRole('link', { name: 'Boards' })).toContainElement(
      screen.getByRole('img', { hidden: true })
    );
    expect(screen.getByRole('img', { hidden: true })).toHaveStyle({
      width: '28px',
      height: '28px',
    });
  });

  it('separates the drawer sign out row with a top rule and a 3 px bottom inset', () => {
    renderRow(
      <NavigationRow
        layout="drawer"
        variant="item"
        id="signOut"
        label="Sign out"
        icon={icon}
        onActivate={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Sign out' })).toHaveStyle({
      borderTopWidth: '1px',
      borderTopColor: '#E1E7EA',
      paddingBottom: '3px',
    });
  });

  it.each(['desktop', 'tablet'] as const)(
    'draws the %s sign out row with no top rule and a 2 px bottom inset',
    (layout) => {
      renderRow(
        <NavigationRow
          layout={layout}
          variant="item"
          id="signOut"
          label="Sign out"
          icon={icon}
          onActivate={jest.fn()}
        />
      );

      expect(screen.getByRole('button', { name: 'Sign out' })).toHaveStyle({
        borderTopWidth: '0px',
        paddingBottom: '2px',
      });
    }
  );
});
