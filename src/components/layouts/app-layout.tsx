import { useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import type { RedirectNavigationState } from '@/routes/types/navigation-state';

export default function AppLayout(): JSX.Element {
  const { state } = useLocation();
  const focusMain = Boolean((state as RedirectNavigationState | null)?.focusMain);
  const focusOnMount = useCallback(
    (node: HTMLElement | null): void => {
      if (focusMain && node) node.focus();
    },
    [focusMain]
  );

  return (
    <main
      ref={focusOnMount}
      tabIndex={-1}
      style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', outline: 'none' }}
    >
      <Outlet />
    </main>
  );
}
