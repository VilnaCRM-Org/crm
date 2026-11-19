import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import type { ScanStepBodyProps } from '../../types/components/two-factor-settings';
import QrCodeImage from '../qr-code-image';

import KeyBlock from './key-block';
import styles from './setup-steps-styles';

export default function ScanStepBody({ otpauthUri, secret }: ScanStepBodyProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      {otpauthUri !== null && (
        <Box sx={styles.qrFrame}>
          <QrCodeImage value={otpauthUri} label={t('settings.two_factor.setup.qr_label')} />
        </Box>
      )}
      {secret !== null && (
        <KeyBlock secret={secret} copyLabel={t('settings.two_factor.setup.copy_key')} />
      )}
      <Box component="p" sx={styles.hint}>
        {t('settings.two_factor.setup.manual_hint')}
      </Box>
    </>
  );
}
