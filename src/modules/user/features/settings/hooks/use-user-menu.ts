import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';

import type { UserMenuOptions, UserMenuState } from '../types/hooks/use-user-menu';

import useUserMenuKeys from './use-user-menu-keys';

export default function useUserMenu({ layout }: UserMenuOptions): UserMenuState {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const chip = useRef<HTMLButtonElement>(null);
  const show = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const dismiss = useCallback(() => {
    setOpen(false);
    chip.current?.focus();
  }, []);
  const keys = useUserMenuKeys({ show, dismiss });

  useEffect(() => setOpen(false), [pathname, layout]);

  return { open, chip, show, close, dismiss, ...keys };
}
