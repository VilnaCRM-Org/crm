import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import UIButton from '@/components/ui-button';
import UIShellContent from '@/components/ui-shell-content';
import ROUTE_PATHS from '@/routes/route-paths';
import useRecoveryNoticeMessage from '@auth/hooks/use-recovery-notice-message';
import type { RecoveryCodesNoticeProps } from '@auth/types/two-factor/recovery-codes-notice';

import styles from './styles';

export default function RecoveryCodesNotice({
  count,
  onDismiss,
}: RecoveryCodesNoticeProps): JSX.Element {
  const { t } = useTranslation();
  const message = useRecoveryNoticeMessage(count);

  return (
    <UIShellContent>
      <Box sx={styles.notice}>
        <Box role="status" aria-atomic="true" sx={styles.message}>
          {message}
        </Box>
        <Box sx={styles.actions}>
          <Box component={Link} to={ROUTE_PATHS.settings} onClick={onDismiss} sx={styles.link}>
            {t('recovery_codes_notice.open_settings')}
          </Box>
          <UIButton type="button" variant="outlined" onClick={onDismiss} sx={styles.dismiss}>
            {t('recovery_codes_notice.dismiss')}
          </UIButton>
        </Box>
      </Box>
    </UIShellContent>
  );
}
