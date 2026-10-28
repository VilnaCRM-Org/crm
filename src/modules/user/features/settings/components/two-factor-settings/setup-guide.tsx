import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import type { SetupGuideProps } from '../../types/components/two-factor-settings';
import QrCodeImage from '../qr-code-image';

import StepItem from './step-item';
import styles from './styles';

export default function SetupGuide({ otpauthUri }: SetupGuideProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <Box component="ol" role="list" sx={styles.steps}>
        <StepItem position={1} text={t('settings.two_factor.steps.install')} />
        <StepItem position={2} text={t('settings.two_factor.steps.scan')} />
      </Box>
      {otpauthUri !== null && (
        <Box sx={styles.qrFrame}>
          <QrCodeImage value={otpauthUri} label={t('settings.two_factor.setup.qr_label')} />
        </Box>
      )}
      <Box component="p" sx={styles.hint}>
        {t('settings.two_factor.setup.manual_hint')}
      </Box>
    </>
  );
}
