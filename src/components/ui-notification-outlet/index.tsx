import { type JSX, useLayoutEffect } from 'react';

import type { UINotificationOutletProps } from '@/components/types/ui-notification-outlet';
import UILiveStatus from '@/components/ui-live-status';
import useNotificationAnnouncement from '@/hooks/use-notification-announcement';
import useNotifications from '@/hooks/use-notifications';

export default function UINotificationOutlet({
  returnFocusRef,
  fallbackFocusRef,
}: UINotificationOutletProps): JSX.Element {
  const { polite, assertive } = useNotificationAnnouncement();
  const { publishFocus, clear } = useNotifications();

  useLayoutEffect(() => {
    publishFocus({ primary: returnFocusRef, fallback: fallbackFocusRef });
  }, [publishFocus, returnFocusRef, fallbackFocusRef]);

  useLayoutEffect(() => clear, [clear]);

  return (
    <>
      <UILiveStatus message={polite} />
      <UILiveStatus message={assertive} politeness="assertive" />
    </>
  );
}
