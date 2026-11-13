import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import type { SetupGuideProps } from '../../types/components/two-factor-settings';

import KeyBlock from './key-block';
import KeyInfoTooltip from './key-info-tooltip';
import ScanStepBody from './scan-step-body';
import styles from './setup-steps-styles';
import StepItem from './step-item';

export default function SetupGuide({ otpauthUri, secret }: SetupGuideProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box component="ol" role="list" sx={styles.steps}>
      <StepItem position={1} text={t('settings.two_factor.steps.install')} />
      <StepItem position={2} text={t('settings.two_factor.steps.scan')}>
        <ScanStepBody otpauthUri={otpauthUri} secret={secret} />
      </StepItem>
      <StepItem
        position={3}
        text={t('settings.two_factor.steps.key')}
        textSx={styles.stepTextBeforeInfo}
        rowSx={styles.stepRowWithInfo}
        action={<KeyInfoTooltip />}
      >
        {secret !== null ? (
          <KeyBlock secret={secret} copyLabel={t('settings.two_factor.setup.copy_backup_key')} />
        ) : null}
      </StepItem>
    </Box>
  );
}
