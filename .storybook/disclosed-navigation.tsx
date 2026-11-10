import type { JSX } from 'react';

import type {
  NavigationGroupProps,
  NavigationItemsProps,
} from '@/components/types/ui-navigation-list';
import NavigationExpandedItems from '@/components/ui-navigation-list/navigation-expanded-items';
import NavigationGroup from '@/components/ui-navigation-list/navigation-group';
import useGroupDisclosure from '@/components/ui-navigation-list/use-group-disclosure';

export function DisclosedGroup({
  layout,
  group,
  currentId,
}: Omit<NavigationGroupProps, 'disclosure'>): JSX.Element {
  const disclosure = useGroupDisclosure();

  return (
    <NavigationGroup layout={layout} group={group} currentId={currentId} disclosure={disclosure} />
  );
}

export function DisclosedItems({
  layout,
  items,
  currentId,
}: Omit<NavigationItemsProps, 'disclosure'>): JSX.Element {
  const disclosure = useGroupDisclosure();

  return (
    <NavigationExpandedItems
      layout={layout}
      items={items}
      currentId={currentId}
      disclosure={disclosure}
    />
  );
}
