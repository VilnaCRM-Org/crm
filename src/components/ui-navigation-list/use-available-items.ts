import { useMemo } from 'react';

import type {
  NavigationItem,
  NavigationItemSet,
  NavigationLeaf,
} from '@/components/types/ui-app-shell/navigation-item';
import featureFlagService from '@/config/runtime/feature-flag-service';

const isAvailable = (leaf: NavigationLeaf): boolean =>
  leaf.flag === undefined || featureFlagService.isEnabled(leaf.flag);

const withAvailableChildren = (item: NavigationItem): NavigationItem =>
  'children' in item
    ? { ...item, children: { items: item.children.items.filter(isAvailable) } }
    : item;

export default function useAvailableNavigationItems(set: NavigationItemSet): NavigationItemSet {
  return useMemo(
    () => ({ items: set.items.filter(isAvailable).map(withAvailableChildren) }),
    [set]
  );
}
