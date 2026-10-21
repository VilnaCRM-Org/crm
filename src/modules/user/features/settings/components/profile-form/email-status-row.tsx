import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UILinkButton from '@/components/ui-link-button';

import type { EmailStatusRowProps } from '../../types/components/profile-form';

import styles from './styles';

export default function EmailStatusRow({
  statusId,
  busy,
  onResend,
}: EmailStatusRowProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box sx={styles.emailRow}>
      <Box component="p" id={statusId} sx={styles.emailStatus}>
        {t('settings.profile.email_unconfirmed')}
      </Box>
      <UILinkButton unavailable={busy} onClick={onResend} sx={styles.resendLink}>
        {t('settings.profile.resend')}
      </UILinkButton>
    </Box>
  );
}
