export type ClipboardCopyStatus = 'idle' | 'copied' | 'failed';

export interface ClipboardCopyRequest {
  readonly text: string;
  readonly fallbackTarget: HTMLElement | null;
}

export interface ClipboardCopy {
  readonly status: ClipboardCopyStatus;
  readonly copy: (request: ClipboardCopyRequest) => Promise<void>;
}
