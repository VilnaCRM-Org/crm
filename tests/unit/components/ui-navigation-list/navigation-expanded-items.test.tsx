import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { createElement, type JSX } from 'react';

import type { NavigationItemsProps } from '@/components/types/ui-navigation-list';
import navigationItems from '@/components/ui-app-shell/navigation-items';
import NavigationExpandedItems from '@/components/ui-navigation-list/navigation-expanded-items';
import useGroupDisclosure from '@/components/ui-navigation-list/use-group-disclosure';
import { styleRuleFor } from '@tests/unit/utils/emotion-style-rules';
import renderShell from '@tests/unit/utils/render-shell';

function DisclosedItems(props: Omit<NavigationItemsProps, 'disclosure'>): JSX.Element {
  return createElement(NavigationExpandedItems, { ...props, disclosure: useGroupDisclosure() });
}

describe('NavigationExpandedItems', () => {
  it('renders the five product rows and the Settings group header, in order', () => {
    renderShell(
      <ol>
        <DisclosedItems layout="desktop" items={navigationItems} currentId={null} />
      </ol>
    );

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Boards',
      'Products',
      'Orders',
      'Contacts',
      'Analytics',
      'Settings',
    ]);
    expect(screen.getByRole('button', { name: 'Expand Settings' })).toBeInTheDocument();
  });

  it('lets a drawer product row item fill the full-screen drawer', () => {
    renderShell(
      <ol>
        <DisclosedItems layout="drawer" items={navigationItems} currentId={null} />
      </ol>
    );

    const [boards] = screen.getAllByRole('listitem');

    expect(boards).toContainElement(screen.getByRole('link', { name: 'Boards' }));
    expect(boards).toHaveStyle({ position: 'relative' });
    expect(styleRuleFor(boards as HTMLElement)?.getPropertyValue('width')).toBe('');
  });

  it.each(['desktop', 'tablet'] as const)(
    'leaves a %s product row item at the width of its list',
    (layout) => {
      renderShell(
        <ol>
          <DisclosedItems layout={layout} items={navigationItems} currentId={null} />
        </ol>
      );

      const [boards] = screen.getAllByRole('listitem');

      expect(boards).toContainElement(screen.getByRole('link', { name: 'Boards' }));
      expect(boards).toHaveStyle({ position: 'relative' });
      expect(boards).not.toHaveStyle({ width: '233px' });
    }
  );

  it('marks only the current row', () => {
    renderShell(
      <ol>
        <DisclosedItems layout="tablet" items={navigationItems} currentId="orders" />
      </ol>
    );

    const current = screen.getAllByRole('link').filter((link) => link.hasAttribute('aria-current'));

    expect(current.map((link) => link.textContent)).toEqual(['Orders']);
  });

  it('closes the gap when a row is filtered out of the set', () => {
    renderShell(
      <ol>
        <DisclosedItems
          layout="desktop"
          items={{ items: navigationItems.items.filter(({ id }) => id !== 'orders') }}
          currentId={null}
        />
      </ol>
    );

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Boards',
      'Products',
      'Contacts',
      'Analytics',
      'Settings',
    ]);
  });

  it('reads in uk', () => {
    renderShell(
      <ol>
        <DisclosedItems layout="desktop" items={navigationItems} currentId={null} />
      </ol>,
      { locale: 'uk' }
    );

    expect(screen.getByRole('link', { name: 'Дошки' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Налаштування' })).toBeInTheDocument();
  });
});
