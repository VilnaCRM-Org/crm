import { useCallback, useState } from 'react';

import type { DrawerOpenFlags, DrawerOpenState } from '@/components/types/ui-app-header';

const CLOSED: DrawerOpenFlags = { open: false, restore: false };

export default function useDrawerOpen(): DrawerOpenState {
  const [flags, setFlags] = useState(CLOSED);
  const show = useCallback(() => setFlags({ open: true, restore: false }), []);
  const dismiss = useCallback(() => setFlags({ open: false, restore: true }), []);
  const leave = useCallback(() => setFlags(CLOSED), []);

  return { ...flags, show, dismiss, leave };
}
