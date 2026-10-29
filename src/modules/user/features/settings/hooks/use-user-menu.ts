import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router';

import type {
  UserMenuControls,
  UserMenuLayoutClose,
  UserMenuOptions,
  UserMenuRefocus,
  UserMenuState,
} from '../types/hooks/use-user-menu';

import useUserMenuKeys from './use-user-menu-keys';

function userMenuControls(
  setOpen: Dispatch<SetStateAction<boolean>>,
  chip: RefObject<HTMLButtonElement | null>
): UserMenuControls {
  return {
    show: (): void => setOpen(true),
    close: (): void => setOpen(false),
    dismiss: (): void => {
      setOpen(false);
      chip.current?.focus();
    },
  };
}

function useChipRefocus({ refocus, setRefocus, chip }: UserMenuRefocus): void {
  useEffect(() => {
    if (!refocus) return;
    setRefocus(false);
    if (document.activeElement === document.body) chip.current?.focus();
  }, [refocus, setRefocus, chip]);
}

function useLayoutClose({ layout, open, setOpen, chip }: UserMenuLayoutClose): void {
  const [shownLayout, setShownLayout] = useState(layout);
  const [refocus, setRefocus] = useState(false);

  if (shownLayout !== layout) {
    setShownLayout(layout);
    setOpen(false);
    setRefocus(open);
  }

  useChipRefocus({ refocus, setRefocus, chip });
}

function useRouteClose(setOpen: Dispatch<SetStateAction<boolean>>): void {
  const { pathname } = useLocation();
  const [shownPathname, setShownPathname] = useState(pathname);

  if (shownPathname !== pathname) {
    setShownPathname(pathname);
    setOpen(false);
  }
}

export default function useUserMenu({ layout }: UserMenuOptions): UserMenuState {
  const [open, setOpen] = useState(false);
  const chip = useRef<HTMLButtonElement>(null);
  const [controls] = useState(() => userMenuControls(setOpen, chip));
  const keys = useUserMenuKeys(controls);
  useLayoutClose({ layout, open, setOpen, chip });
  useRouteClose(setOpen);

  return { open, chip, ...controls, ...keys };
}
