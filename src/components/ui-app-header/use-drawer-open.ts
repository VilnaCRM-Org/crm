import { type Dispatch, type SetStateAction, useState } from 'react';

import type {
  DrawerOpenControls,
  DrawerOpenFlags,
  DrawerOpenState,
} from '@/components/types/ui-app-header';

function closedFlags(): DrawerOpenFlags {
  return { open: false, restore: false };
}

function drawerOpenControls(
  setFlags: Dispatch<SetStateAction<DrawerOpenFlags>>
): DrawerOpenControls {
  return {
    show: (): void => setFlags({ open: true, restore: false }),
    dismiss: (): void => setFlags({ open: false, restore: true }),
    leave: (): void => setFlags(closedFlags()),
  };
}

export default function useDrawerOpen(): DrawerOpenState {
  const [flags, setFlags] = useState(closedFlags);
  const [controls] = useState(() => drawerOpenControls(setFlags));

  return { ...flags, ...controls };
}
