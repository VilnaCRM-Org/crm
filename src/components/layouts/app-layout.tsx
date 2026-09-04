import { Box } from '@mui/material';
import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import type { RedirectNavigationState } from '@/routes/types/navigation-state';

export default function AppLayout(): JSX.Element {
  const { state } = useLocation();
  const focusMain = Boolean((state as RedirectNavigationState | null)?.focusMain);
  const mainRef = useRef<HTMLElement | null>(null);
  const hasFocused = useRef(false);

  // One-shot: `focusMain` lives on the history entry, so navigating Back to the landing entry
  // would otherwise re-raise it and yank focus out of whatever the user is on mid-session.
  useEffect(() => {
    if (!focusMain || hasFocused.current) return;

    hasFocused.current = true;
    mainRef.current?.focus();
  }, [focusMain]);

  return (
    <Box
      component="main"
      ref={mainRef}
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
