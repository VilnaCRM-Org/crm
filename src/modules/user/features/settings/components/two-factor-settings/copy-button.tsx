import Box from '@mui/material/Box';
import type { JSX } from 'react';

import UIButton from '@/components/ui-button';
import UILiveStatus from '@/components/ui-live-status';

import useCopyAnnouncement from '../../hooks/use-copy-announcement';
import type { CopyButtonProps } from '../../types/components/two-factor-settings';

import CopiedLine from './copied-line';
import styles from './copy-line-styles';

export default function CopyButton({ label, ...request }: CopyButtonProps): JSX.Element {
  const { status, message, onCopy } = useCopyAnnouncement(request);

  return (
    <>
      <Box sx={styles.slot}>
        {status === 'copied' && <CopiedLine text={request.copiedText} />}
        {status === 'failed' && (
          <Box component="p" aria-hidden="true" sx={styles.failedLine}>
            {request.failedText}
          </Box>
        )}
      </Box>
      <UIButton type="button" variant="outlinedPill" onClick={onCopy}>
        {label}
      </UIButton>
      <UILiveStatus message={message} />
    </>
  );
}
