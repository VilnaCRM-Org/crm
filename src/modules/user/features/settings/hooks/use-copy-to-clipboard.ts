import { useCallback, useState } from 'react';

import type {
  ClipboardCopy,
  ClipboardCopyRequest,
  ClipboardCopyStatus,
} from '../types/hooks/use-copy-to-clipboard';

function selectContents(target: HTMLElement | null): void {
  if (target === null) return;
  const range = document.createRange();
  range.selectNodeContents(target);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

async function writeOrSelect({
  text,
  fallbackTarget,
}: ClipboardCopyRequest): Promise<ClipboardCopyStatus> {
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    selectContents(fallbackTarget);
    return 'failed';
  }
}

export default function useCopyToClipboard(): ClipboardCopy {
  const [status, setStatus] = useState<ClipboardCopyStatus>('idle');

  const copy = useCallback(
    async (request: ClipboardCopyRequest) => {
      setStatus('idle');
      setStatus(await writeOrSelect(request));
    },
    // Stryker disable next-line ArrayDeclaration: equivalent, deps stay Object.is-equal
    []
  );

  return { status, copy };
}
