import Box from '@mui/material/Box';
import { type JSX, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { CodesBlockProps } from '../../types/components/two-factor-settings';

import CopyButton from './copy-button';
import styles from './styles';

export default function CodesBlock({ codes }: CodesBlockProps): JSX.Element {
  const { t } = useTranslation();
  const listRef = useRef<HTMLElement>(null);

  return (
    <>
      <Box
        component="ol"
        ref={listRef}
        aria-label={t('settings.two_factor.codes.list_label')}
        sx={styles.codeList}
      >
        {codes.items.map((code) => (
          <Box component="li" key={code.value} sx={styles.codeItem}>
            {code.value}
          </Box>
        ))}
      </Box>
      <CopyButton
        text={codes.items.map((code) => code.value).join('\n')}
        targetRef={listRef}
        label={t('settings.two_factor.codes.copy')}
        copiedText={t('settings.two_factor.codes.copied')}
        failedText={t('settings.two_factor.codes.copy_failed')}
      />
    </>
  );
}
