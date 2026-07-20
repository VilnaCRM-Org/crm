import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import SubmitSpinner from '@/components/ui-form/submit-spinner';
import UILiveStatus from '@/components/ui-live-status';

import styles from './styles';

// Announce loading only after a short delay: this turns the live region into an observed
// DOM mutation (reliably announced by NVDA/JAWS) and stays silent on fast/cached chunk
// loads that unmount before the timer fires.
const ANNOUNCE_DELAY_MS = 150;

export default function RouteFallback(): JSX.Element {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(
      () => setMessage(t('route_fallback.loading')),
      ANNOUNCE_DELAY_MS
    );
    return (): void => window.clearTimeout(timer);
  }, [t]);

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.pill}>
        <SubmitSpinner />
      </Box>
      <UILiveStatus message={message} />
    </Box>
  );
}
