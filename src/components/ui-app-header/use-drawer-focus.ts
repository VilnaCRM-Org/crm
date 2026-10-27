import { useEffect, useRef } from 'react';

import type { DrawerFocusOptions } from '@/components/types/ui-app-header';

const focusMain = (): void => {
  document.querySelector<HTMLElement>('main[tabindex="-1"]')?.focus();
};

const settleFocus = ({ open, restore, burger }: DrawerFocusOptions, wasShowing: boolean): void => {
  if (!open && restore) burger.current?.focus();
  if (wasShowing && !open && !restore) focusMain();
};

export default function useDrawerFocus({ open, restore, burger }: DrawerFocusOptions): void {
  const showing = useRef(false);

  useEffect(() => {
    settleFocus({ open, restore, burger }, showing.current);
    showing.current = open;
  }, [open, restore, burger]);

  useEffect(
    () => (): void => {
      if (showing.current) focusMain();
    },
    []
  );
}
