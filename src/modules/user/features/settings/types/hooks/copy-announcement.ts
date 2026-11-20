import type { RefObject } from 'react';

import type { ClipboardCopyStatus } from './use-copy-to-clipboard';

export interface CopyAnnouncementRequest {
  readonly text: string;
  readonly targetRef: RefObject<HTMLElement | null>;
  readonly copiedText: string;
  readonly failedText: string;
}

export interface CopyAnnouncement {
  readonly status: ClipboardCopyStatus;
  readonly message: string;
  readonly onCopy: () => void;
}
