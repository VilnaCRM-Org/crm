import { type JSX, useState } from 'react';

import UIButton from '@/components/ui-button';
import UILiveStatus from '@/components/ui-live-status';
import ALTERNATING_MARK from '@/lib/live-region/alternating-mark';

import useCopyToClipboard from '../../hooks/use-copy-to-clipboard';
import type { CopyButtonProps } from '../../types/components/two-factor-settings';

import styles from './styles';

export default function CopyButton({
  text,
  targetRef,
  label,
  copiedText,
  failedText,
}: CopyButtonProps): JSX.Element {
  const { status, copy } = useCopyToClipboard();
  const [presses, setPresses] = useState(0);
  const messages = new Map([
    ['copied', copiedText],
    ['failed', failedText],
  ]);
  const message = messages.get(status);

  const onClick = (): void => {
    setPresses(presses + 1);
    copy({ text, fallbackTarget: targetRef.current });
  };

  return (
    <>
      <UIButton type="button" variant="outlined" onClick={onClick} sx={styles.copyButton}>
        {label}
      </UIButton>
      <UILiveStatus
        message={
          message === undefined ? '' : `${message}${presses % 2 === 0 ? ALTERNATING_MARK : ''}`
        }
      />
    </>
  );
}
