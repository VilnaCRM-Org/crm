import { useState } from 'react';

import ALTERNATING_MARK from '@/lib/live-region/alternating-mark';

import type { CopyAnnouncement, CopyAnnouncementRequest } from '../types/hooks/copy-announcement';

import useCopyToClipboard from './use-copy-to-clipboard';

export default function useCopyAnnouncement({
  text,
  targetRef,
  copiedText,
  failedText,
}: CopyAnnouncementRequest): CopyAnnouncement {
  const { status, copy } = useCopyToClipboard();
  const [marked, setMarked] = useState(true);
  const message = new Map([
    ['copied', copiedText],
    ['failed', failedText],
  ]).get(status);

  return {
    status,
    message: message === undefined ? '' : `${message}${marked ? ALTERNATING_MARK : ''}`,
    onCopy: (): void => {
      setMarked(!marked);
      copy({ text, fallbackTarget: targetRef.current });
    },
  };
}
