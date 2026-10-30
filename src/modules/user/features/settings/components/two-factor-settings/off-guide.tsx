import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import StepItem from './step-item';
import styles from './styles';

export default function OffGuide(): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <Box component="p" sx={styles.description}>
        {t('settings.two_factor.off.description')}
      </Box>
      <Box component="ol" role="list" sx={styles.steps}>
        <StepItem position={1} text={t('settings.two_factor.steps.install')} />
        <StepItem position={2} text={t('settings.two_factor.steps.scan')} />
        <StepItem position={3} text={t('settings.two_factor.steps.key')} />
      </Box>
    </>
  );
}
