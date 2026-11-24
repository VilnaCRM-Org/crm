import { useCallback, useRef, useState } from 'react';

import type { ShellLayout } from '@/components/types/ui-app-shell';
import useNotifications from '@/hooks/use-notifications';

import type { BellDisclosure } from '../types/bell-disclosure';

import useBellContextClose from './use-bell-context-close';
import useBellDismissal from './use-bell-dismissal';

export default function useBellDisclosure(layout: ShellLayout): BellDisclosure {
  const [expanded, setExpanded] = useState(false);
  const [visited, setVisited] = useState(false);
  const bell = useRef<HTMLButtonElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const { dismissAll } = useNotifications();

  const show = useCallback((): void => {
    setExpanded(true);
    setVisited(true);
    dismissAll();
  }, [dismissAll]);
  const close = useCallback(
    (): void => setExpanded(false),
    // Stryker disable next-line ArrayDeclaration: equivalent, deps stay Object.is-equal
    []
  );
  const toggle = useCallback((): void => (expanded ? close() : show()), [expanded, show, close]);
  const dismissal = useBellDismissal({ expanded, close, bell, wrapper });
  useBellContextClose({ layout, close });

  return { expanded, visited, bell, wrapper, show, close, toggle, ...dismissal };
}
