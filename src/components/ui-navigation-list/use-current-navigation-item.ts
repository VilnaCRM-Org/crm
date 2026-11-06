import { matchPath, useLocation } from 'react-router';

import type {
  NavigationItemId,
  NavigationItemSet,
} from '@/components/types/ui-app-shell/navigation-item';

export default function useCurrentNavigationItem(set: NavigationItemSet): NavigationItemId | null {
  const { pathname } = useLocation();
  const current = set.items
    .flatMap((item) => ('children' in item ? [item, ...item.children.items] : [item]))
    .find((leaf) => matchPath({ path: leaf.href, end: true }, pathname) !== null);

  return current?.id ?? null;
}
