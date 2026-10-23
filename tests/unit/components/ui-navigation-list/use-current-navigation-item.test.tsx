import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

import type { NavigationItemSet } from '@/components/types/ui-app-shell/navigation-item';
import useCurrentNavigationItem from '@/components/ui-navigation-list/use-current-navigation-item';

const icon = 'svg' as unknown as NavigationItemSet['items'][number]['icon'];

const set: NavigationItemSet = {
  items: [
    { id: 'boards', href: '/boards', labelKey: 'a', icon },
    { id: 'products', href: '/products', labelKey: 'b', icon },
    {
      id: 'settings',
      href: '/settings',
      labelKey: 'c',
      icon,
      children: {
        items: [
          { id: 'integrations', href: '/settings/integrations', labelKey: 'd', icon },
          { id: 'billing', href: '/settings/billing', labelKey: 'e', icon },
        ],
      },
    },
  ],
};

const currentAt = (path: string, items: NavigationItemSet = set): string | null => {
  const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
  );

  return renderHook(() => useCurrentNavigationItem(items), { wrapper }).result.current;
};

describe('useCurrentNavigationItem', () => {
  it.each([
    ['/boards', 'boards'],
    ['/products', 'products'],
    ['/settings', 'settings'],
    ['/settings/integrations', 'integrations'],
    ['/settings/billing', 'billing'],
  ])('marks %s as the %s item', (path, id) => {
    expect(currentAt(path)).toBe(id);
  });

  it.each(['/settings/', '/settings?tab=x', '/boards/', '/boards?x=1#top'])(
    'keeps a trailing slash or a query string current: %s',
    (path) => {
      expect(currentAt(path)).not.toBeNull();
    }
  );

  it('does not make the group current for a sub-route', () => {
    expect(currentAt('/settings/webhooks')).toBeNull();
    expect(currentAt('/settings/integrations')).not.toBe('settings');
  });

  it('marks nothing on the home route and on an unknown route', () => {
    expect(currentAt('/')).toBeNull();
    expect(currentAt('/somewhere-else')).toBeNull();
  });

  it('marks nothing for an item that is not in the set', () => {
    const withoutSettings: NavigationItemSet = { items: set.items.slice(0, 2) };

    expect(currentAt('/settings', withoutSettings)).toBeNull();
    expect(currentAt('/settings/integrations', withoutSettings)).toBeNull();
  });
});
