import { Box } from '@mui/material';
import { type ComponentType, type JSX, lazy, Suspense } from 'react';
import { Outlet, useOutletContext } from 'react-router';

import useArrivalFocus from '@/hooks/use-arrival-focus';
import type { ProtectedOutletContext } from '@/routes/types/protected-outlet-context';

import footerLoader from './footer-loader';

function FooterUnavailable(): null {
  return null;
}

const UIFooter = lazy<ComponentType>(() =>
  footerLoader.load().catch(() => ({ default: FooterUnavailable }))
);

export default function AppLayout(): JSX.Element {
  const focusOnArrival = useArrivalFocus();
  const outletContext = useOutletContext<ProtectedOutletContext>();

  return (
    <>
      <Box
        component="main"
        ref={focusOnArrival}
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
        <Outlet context={outletContext} />
      </Box>
      <Suspense fallback={<Box aria-hidden="true" sx={{ minHeight: '4.125rem' }} />}>
        <UIFooter />
      </Suspense>
    </>
  );
}
