import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import navigationItems from '@/components/ui-app-shell/navigation-items';
import NavigationRailItems from '@/components/ui-navigation-list/navigation-rail-items';
import renderShell from '@tests/unit/utils/render-shell';

describe('NavigationRailItems', () => {
  it('renders every product row and the three former sub-items as top-level rows', () => {
    renderShell(
      <ol>
        <NavigationRailItems layout="desktop" items={navigationItems} currentId={null} />
      </ol>
    );

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
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
    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/boards',
      '/products',
      '/orders',
      '/contacts',
      '/analytics',
      '/settings',
      '/settings/integrations',
      '/settings/webhooks',
      '/settings/billing',
    ]);
  });

  it('renders no group and no chevron', () => {
    renderShell(
      <ol>
        <NavigationRailItems layout="tablet" items={navigationItems} currentId={null} />
      </ol>
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('marks the current rail row, a sub-route row included', () => {
    renderShell(
      <ol>
        <NavigationRailItems layout="desktop" items={navigationItems} currentId="webhooks" />
      </ol>
    );

    const current = screen.getAllByRole('link').filter((link) => link.hasAttribute('aria-current'));

    expect(current.map((link) => link.textContent)).toEqual(['Webhooks']);
  });

  it('reads in uk', () => {
    renderShell(
      <ol>
        <NavigationRailItems layout="desktop" items={navigationItems} currentId={null} />
      </ol>,
      { locale: 'uk' }
    );

    expect(screen.getByRole('link', { name: 'Білінг' })).toBeInTheDocument();
  });
});
