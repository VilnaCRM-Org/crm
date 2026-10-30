import { Box } from '@mui/material';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UILinkButton from '@/components/ui-link-button';
import type { ModeToggleProps } from '@auth/types/two-factor/challenge-components';

import styles from './styles';

export default function ModeToggle({ mode, busy, onSwitch }: ModeToggleProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box sx={styles.toggleRow}>
      <UILinkButton unavailable={busy} onClick={onSwitch} sx={styles.toggle}>
        {mode === 'totp'
          ? t('two_factor.recovery.use_recovery')
          : t('two_factor.recovery.use_authenticator')}
      </UILinkButton>
    </Box>
  );
}
