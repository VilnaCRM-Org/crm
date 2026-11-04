import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './setup-steps-styles';
import StepItem from './step-item';

export default function OffGuide(): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box component="ol" role="list" sx={styles.steps}>
      <StepItem position={1} text={t('settings.two_factor.steps.install')} />
      <StepItem position={2} text={t('settings.two_factor.steps.scan')} />
      <StepItem position={3} text={t('settings.two_factor.steps.key')} />
    </Box>
  );
}
