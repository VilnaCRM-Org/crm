import Box from '@mui/material/Box';
import { type JSX, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { KeyBlockProps } from '../../types/components/two-factor-settings';

import CopyButton from './copy-button';
import KeyChip from './key-chip';
import styles from './styles';

export default function KeyBlock({ secret }: KeyBlockProps): JSX.Element | null {
  const { t } = useTranslation();
  const chipRef = useRef<HTMLElement>(null);
  if (secret === null) return null;

  return (
    <Box sx={styles.copyRow}>
      <KeyChip secret={secret} chipRef={chipRef} />
      <CopyButton
        text={secret}
        targetRef={chipRef}
        label={t('settings.two_factor.setup.copy_key')}
        copiedText={t('settings.two_factor.setup.key_copied')}
        failedText={t('settings.two_factor.setup.copy_failed')}
      />
    </Box>
  );
}
