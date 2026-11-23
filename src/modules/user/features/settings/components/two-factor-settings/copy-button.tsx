import Box from '@mui/material/Box';
import type { JSX } from 'react';

import UIButton from '@/components/ui-button';
import UILiveStatus from '@/components/ui-live-status';

import useCopiedHold from '../../hooks/use-copied-hold';
import useCopyAnnouncement from '../../hooks/use-copy-announcement';
import type { CopyButtonProps } from '../../types/components/two-factor-settings';

import CopyLabel from './copy-label';
import styles from './copy-line-styles';

export default function CopyButton({ label, ...request }: CopyButtonProps): JSX.Element {
  const { status, message, onCopy } = useCopyAnnouncement(request);
  const copied = useCopiedHold({ status, message });

  return (
    <>
      <Box sx={styles.slot}>
        {status === 'failed' && (
          <Box component="p" aria-hidden="true" sx={styles.failedLine}>
            {request.failedText}
          </Box>
        )}
      </Box>
      <UIButton type="button" variant="outlinedPill" onClick={onCopy}>
        <CopyLabel label={label} copiedText={request.copiedText} copied={copied} />
      </UIButton>
      <UILiveStatus message={message} />
    </>
  );
}
