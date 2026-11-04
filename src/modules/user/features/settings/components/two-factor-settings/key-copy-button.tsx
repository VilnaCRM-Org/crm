import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import Box from '@mui/material/Box';
import type { JSX } from 'react';

import { ReactComponent as CopyIcon } from '../../assets/copy-02.svg';
import type { KeyCopyButtonProps } from '../../types/components/two-factor-settings';

import styles from './setup-steps-styles';

export default function KeyCopyButton({ label, copied, onCopy }: KeyCopyButtonProps): JSX.Element {
  return (
    <Box
      component="button"
      type="button"
      aria-label={label}
      onClick={onCopy}
      sx={styles.copyIconButton}
    >
      {copied ? (
        <CheckCircleOutlinedIcon aria-hidden="true" sx={styles.copyIcon} />
      ) : (
        <Box component={CopyIcon} aria-hidden="true" focusable="false" sx={styles.copyIcon} />
      )}
    </Box>
  );
}
