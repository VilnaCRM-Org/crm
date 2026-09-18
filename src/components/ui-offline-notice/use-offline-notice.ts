import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// How long "connection restored" stays in the live region after the network comes back.
const RESTORED_NOTICE_MS = 5_000;

function scheduleRestoredNotice(setRestored: (restored: boolean) => void): () => void {
  setRestored(true);
  const timer = setTimeout(() => setRestored(false), RESTORED_NOTICE_MS);
  return (): void => clearTimeout(timer);
}

// True for a few seconds after an observed reconnection. A fresh mount that is already online
// announces nothing — only an observed transition is news (issue #147).
function useRestoredNotice(online: boolean): boolean {
  const [restored, setRestored] = useState(false);
  const wasOffline = useRef(false);

  useEffect((): (() => void) | undefined => {
    if (!online) {
      wasOffline.current = true;
      return undefined;
    }
    return wasOffline.current ? scheduleRestoredNotice(setRestored) : undefined;
  }, [online]);

  return restored;
}

// The message the notice shows: the offline copy while offline, the restored copy for a
// few seconds after a reconnection, and nothing otherwise.
export default function useOfflineNotice(online: boolean): string {
  const { t } = useTranslation();
  const restored = useRestoredNotice(online);

  if (!online) return t('offline_notice.offline');
  return restored ? t('offline_notice.restored') : '';
}
