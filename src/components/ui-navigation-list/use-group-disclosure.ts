import { useCallback, useState } from 'react';
import { matchPath, useLocation } from 'react-router';

import type { GroupDisclosureState } from '@/components/types/ui-navigation-list';

export default function useGroupDisclosure(href: string): GroupDisclosureState {
  const { pathname } = useLocation();
  const routeExpanded = matchPath({ path: href, end: false }, pathname) !== null;
  const [override, setOverride] = useState<boolean | null>(null);
  const [overridePath, setOverridePath] = useState(pathname);

  if (overridePath !== pathname) {
    setOverridePath(pathname);
    setOverride(null);
  }

  const expanded = override ?? routeExpanded;
  const toggle = useCallback(() => setOverride(!expanded), [expanded]);

  return { expanded, toggle };
}
