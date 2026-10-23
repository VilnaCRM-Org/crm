import { useCallback, useState } from 'react';
import { useLocation } from 'react-router';

import type {
  DisclosureOverride,
  GroupDisclosureState,
} from '@/components/types/ui-navigation-list';

export default function useGroupDisclosure(href: string): GroupDisclosureState {
  const { pathname } = useLocation();
  const routeExpanded = pathname === href || pathname.startsWith(`${href}/`);
  const [override, setOverride] = useState<DisclosureOverride | null>(null);
  const expanded = override?.pathname === pathname ? override.expanded : routeExpanded;
  const toggle = useCallback(
    () => setOverride({ pathname, expanded: !expanded }),
    [pathname, expanded]
  );

  return { expanded, toggle };
}
