import Box from '@mui/material/Box';
import { type JSX, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { RouteFallbackProps } from '@/components/types/route-fallback';
import UILiveStatus from '@/components/ui-live-status';

import styles from './styles';

// Paint nothing for the first frames of a route transition. Most chunk loads resolve well
// inside this window, so the fallback never paints: no loader flash, and no layout shift
// from swapping a full-height placeholder for the real page (issue #117 — the visible
// placeholder cost ~0.03 of the mobile Lighthouse budget).
//
// The live region is deliberately rendered OUTSIDE this gate: it mounts empty at t=0 and its
// text arrives on the same timer, so the announcement is an observed DOM mutation rather than
// a create-and-fill in one commit (which screen readers frequently drop).
const SHOW_DELAY_MS = 150;

export default function RouteFallback({
  minHeight = '50vh',
  message,
}: RouteFallbackProps): JSX.Element {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);
  const announcement = message ?? t('route_fallback.loading');

  useEffect(
    () => {
      const timer = window.setTimeout(() => setPending(true), SHOW_DELAY_MS);
      return (): void => window.clearTimeout(timer);
    },
    // Stryker disable next-line ArrayDeclaration: equivalent, deps stay Object.is-equal
    []
  );

  return (
    <>
      {pending && (
        <Box sx={{ ...styles.wrapper, minHeight }}>
          <Box sx={styles.pill}>
            <Box aria-hidden="true" sx={styles.spinner} />
          </Box>
        </Box>
      )}
      <UILiveStatus message={pending ? announcement : ''} />
    </>
  );
}
