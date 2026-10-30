import { useMemo } from 'react';

import type {
  NavigationItem,
  NavigationItemSet,
  NavigationLeaf,
} from '@/components/types/ui-app-shell/navigation-item';
import featureFlagService from '@/config/runtime/feature-flag-service';

const isAvailable = (leaf: NavigationLeaf): boolean =>
  leaf.flag === undefined || featureFlagService.isEnabled(leaf.flag);

const asLeaf = ({ id, href, labelKey, icon, flag }: NavigationLeaf): NavigationLeaf => ({
  id,
  href,
  labelKey,
  icon,
  flag,
});

const withAvailableChildren = (item: NavigationItem): NavigationItem => {
  if (!('children' in item)) return item;

  const children = item.children.items.filter(isAvailable);

  return children.length === 0 ? asLeaf(item) : { ...item, children: { items: children } };
};

export default function useAvailableNavigationItems(set: NavigationItemSet): NavigationItemSet {
  return useMemo(
    () => ({ items: set.items.filter(isAvailable).map(withAvailableChildren) }),
    [set]
  );
}
