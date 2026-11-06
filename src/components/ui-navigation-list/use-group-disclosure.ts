import { useState } from 'react';
import { matchPath, useLocation } from 'react-router';

import type {
  DisclosureGroup,
  GroupDisclosure,
  GroupDisclosureState,
} from '@/components/types/ui-navigation-list';

export default function useGroupDisclosure(): GroupDisclosure {
  const { pathname } = useLocation();
  const [overrides, setOverrides] = useState<Readonly<Record<string, boolean>>>({});
  const [overridePath, setOverridePath] = useState(pathname);

  if (overridePath !== pathname) {
    setOverridePath(pathname);
    setOverrides({});
  }

  const stateOf = ({ id, href }: DisclosureGroup): GroupDisclosureState => {
    const expanded = overrides[id] ?? matchPath({ path: href, end: false }, pathname) !== null;

    return { expanded, toggle: () => setOverrides({ ...overrides, [id]: !expanded }) };
  };

  return { stateOf };
}
