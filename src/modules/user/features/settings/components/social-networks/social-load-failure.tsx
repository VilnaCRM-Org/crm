import Box from '@mui/material/Box';
import { type JSX, useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';

import UIButton from '@/components/ui-button';

import type { SocialLoadFailureProps } from '../../types/components/social-networks';

import styles from './styles';

export default function SocialLoadFailure({
  retrying,
  headingRef,
  onRetry,
}: SocialLoadFailureProps): JSX.Element {
  const { t } = useTranslation();
  const messageId = useId();
  const handOver = useCallback(
    (button: HTMLButtonElement | null) => (): void => {
      if (document.activeElement === button) headingRef.current?.focus();
    },
    [headingRef]
  );

  return (
    <Box sx={styles.failure}>
      <Box component="p" id={messageId} sx={styles.failureMessage}>
        {retrying ? t('settings.social.loading') : t('settings.social.load_failed')}
      </Box>
      <UIButton
        ref={handOver}
        variant="outlined"
        aria-describedby={messageId}
        aria-disabled={retrying}
        disableRipple={retrying}
        sx={styles.retryButton}
        onClick={onRetry}
      >
        {t('auth.error.tryAgain')}
      </UIButton>
    </Box>
  );
}
