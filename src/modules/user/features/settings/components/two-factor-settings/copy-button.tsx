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
  const [marked, setMarked] = useState(true);
  const messages = new Map([
    ['copied', copiedText],
    ['failed', failedText],
  ]);
  const message = messages.get(status);

  const onClick = (): void => {
    setMarked(!marked);
    copy({ text, fallbackTarget: targetRef.current });
  };

  return (
    <>
      <UIButton type="button" variant="outlined" onClick={onClick} sx={styles.copyButton}>
        {label}
      </UIButton>
      <UILiveStatus
        message={message === undefined ? '' : `${message}${marked ? ALTERNATING_MARK : ''}`}
      />
    </>
  );
}
