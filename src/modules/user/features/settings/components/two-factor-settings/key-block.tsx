import Box from '@mui/material/Box';
import { type JSX, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import UILiveStatus from '@/components/ui-live-status';

import useCopyAnnouncement from '../../hooks/use-copy-announcement';
import type { KeyBlockProps } from '../../types/components/two-factor-settings';

import KeyChip from './key-chip';
import KeyCopyButton from './key-copy-button';
import styles from './setup-steps-styles';

export default function KeyBlock({ secret, copyLabel }: KeyBlockProps): JSX.Element {
  const { t } = useTranslation();
  const chipRef = useRef<HTMLElement>(null);
  const failedText = t('settings.two_factor.setup.copy_failed');
  const copy = useCopyAnnouncement({
    text: secret,
    targetRef: chipRef,
    copiedText: t('settings.two_factor.setup.key_copied'),
    failedText,
  });

  return (
    <>
      <Box sx={styles.keyChip}>
        <KeyChip secret={secret} chipRef={chipRef} />
        <KeyCopyButton label={copyLabel} copied={copy.status === 'copied'} onCopy={copy.onCopy} />
      </Box>
      {copy.status === 'failed' && (
        <Box component="p" aria-hidden="true" sx={styles.copyFailed}>
          {failedText}
        </Box>
      )}
      <UILiveStatus message={copy.message} />
    </>
  );
}
