import type { JSX } from 'react';

import type { NavigationSignOutProps } from '@/components/types/ui-navigation-list';

import NavigationDrawerSignOut from './navigation-drawer-sign-out';
import NavigationSidebarSignOut from './navigation-sidebar-sign-out';

export default function NavigationSignOut({
  layout,
  variant,
  onSignOut,
}: NavigationSignOutProps): JSX.Element {
  return layout === 'drawer' ? (
    <NavigationDrawerSignOut onSignOut={onSignOut} />
  ) : (
    <NavigationSidebarSignOut layout={layout} variant={variant} onSignOut={onSignOut} />
  );
}
