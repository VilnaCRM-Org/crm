import { type RefCallback, type RefObject, useEffect, useRef, useState } from 'react';

import type {
  DrawerBurger,
  DrawerFocusOptions,
  DrawerOpenFlags,
} from '@/components/types/ui-app-header';

const focusMain = (): void => {
  document.querySelector<HTMLElement>('main[tabindex="-1"]')?.focus();
};

const settleFocus = ({ open, restore, burger }: DrawerFocusOptions, wasShowing: boolean): void => {
  if (!open && restore) burger.current?.focus();
  if (wasShowing && !open && !restore) focusMain();
};

function useBurger(showing: RefObject<boolean>): DrawerBurger {
  const burger = useRef<HTMLButtonElement>(null);
  const [attach] = useState(() => (node: HTMLButtonElement | null) => {
    burger.current = node;

    return (): void => {
      if (showing.current) focusMain();
    };
  });

  return { burger, attach };
}

export default function useDrawerFocus({
  open,
  restore,
}: DrawerOpenFlags): RefCallback<HTMLButtonElement> {
  const showing = useRef(false);
  const { burger, attach } = useBurger(showing);

  useEffect(() => {
    settleFocus({ open, restore, burger }, showing.current);
    showing.current = open;
  }, [open, restore, burger]);

  return attach;
}
