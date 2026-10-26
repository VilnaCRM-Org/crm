import { type KeyboardEvent, useCallback } from 'react';

import type { UserMenuKeys, UserMenuKeysOptions } from '../types/hooks/use-user-menu';

export default function useUserMenuKeys({ show, dismiss }: UserMenuKeysOptions): UserMenuKeys {
  const chipKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== 'ArrowDown') return;
      event.preventDefault();
      show();
    },
    [show]
  );
  const menuKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Escape' || event.key === 'Tab') dismiss();
    },
    [dismiss]
  );

  return { chipKeyDown, menuKeyDown };
}
