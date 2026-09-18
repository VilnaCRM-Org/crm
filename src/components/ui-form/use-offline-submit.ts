import { useId, useLayoutEffect, useRef } from 'react';

import type { OfflineSubmit } from '@/components/types/ui-form';
import useConnectivity from '@/hooks/use-connectivity';

// Disabling a focused button drops keyboard focus to <body> silently. When the connection
// goes away while the submit holds focus, park focus on the offline notice instead so the
// user hears why and Tab resumes from the same spot. A layout effect still sees the button as
// the active element: the browser's focus fixup runs after the commit (issue #147).
function useOfflineFocus(
  online: boolean,
  submitRef: OfflineSubmit['submitRef'],
  noticeRef: OfflineSubmit['noticeRef']
): void {
  useLayoutEffect(() => {
    if (online || document.activeElement !== submitRef.current) return;
    noticeRef.current?.focus({ preventScroll: true });
  }, [online, submitRef, noticeRef]);
}

// Everything a form needs to disable its submit while offline and describe the reason.
export default function useOfflineSubmit(): OfflineSubmit {
  const online = useConnectivity();
  const noticeId = useId();
  const noticeRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  useOfflineFocus(online, submitRef, noticeRef);

  return { online, noticeId, noticeRef, submitRef };
}
