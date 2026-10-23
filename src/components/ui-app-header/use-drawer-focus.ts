import { useEffect, useRef } from 'react';

import type { DrawerFocusOptions } from '@/components/types/ui-app-header';

export default function useDrawerFocus({ open, restore, burger }: DrawerFocusOptions): void {
  const showing = useRef(false);

  useEffect(() => {
    showing.current = open;
    if (!open && restore) burger.current?.focus();
  }, [open, restore, burger]);

  useEffect(
    () => (): void => {
      if (showing.current) document.querySelector<HTMLElement>('main[tabindex="-1"]')?.focus();
    },
    []
  );
}
