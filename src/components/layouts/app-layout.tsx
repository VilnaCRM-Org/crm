import { Box } from '@mui/material';
import { useCallback, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import type { RedirectNavigationState } from '@/routes/types/navigation-state';

export default function AppLayout(): JSX.Element {
  const { state } = useLocation();
  const focusMain = Boolean((state as RedirectNavigationState | null)?.focusMain);
  const hasFocused = useRef(false);

  // One-shot: `focusMain` lives on the history entry, so navigating Back to the landing entry
  // re-attaches this ref, and without the guard focus would be yanked back to <main> mid-session.
  const focusOnce = useCallback(
    (node: HTMLElement | null): void => {
      if (!node || hasFocused.current) return;

      hasFocused.current = true;
      node.focus();
    },
    // Stryker disable next-line ArrayDeclaration: equivalent, deps stay Object.is-equal
    []
  );

  return (
    <Box
      component="main"
      ref={focusMain ? focusOnce : undefined}
      tabIndex={-1}
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        // The landmark is focusable only so the post-login redirect can land on it. Suppress the
        // ring for that programmatic case, never for a keyboard user who tabs into it.
        '&:focus:not(:focus-visible)': { outline: 'none' },
      }}
    >
      <Outlet />
    </Box>
  );
}
