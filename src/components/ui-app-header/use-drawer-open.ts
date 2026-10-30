import { type Dispatch, type SetStateAction, useState } from 'react';

import type {
  DrawerOpenControls,
  DrawerOpenFlags,
  DrawerOpenState,
} from '@/components/types/ui-app-header';

const CLOSED: DrawerOpenFlags = { open: false, restore: false };

function drawerOpenControls(
  setFlags: Dispatch<SetStateAction<DrawerOpenFlags>>
): DrawerOpenControls {
  return {
    show: (): void => setFlags({ open: true, restore: false }),
    dismiss: (): void => setFlags({ open: false, restore: true }),
    leave: (): void => setFlags(CLOSED),
  };
}

export default function useDrawerOpen(): DrawerOpenState {
  const [flags, setFlags] = useState(CLOSED);
  const [controls] = useState(() => drawerOpenControls(setFlags));

  return { ...flags, ...controls };
}
