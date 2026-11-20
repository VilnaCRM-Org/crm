import Box from '@mui/material/Box';
import { type JSX, useCallback, useMemo, useRef } from 'react';

import type {
  NoticeListProps,
  NoticeRowProps,
  UIBellNoticeProps,
} from '@/components/types/ui-bell-notice';
import UINotificationContent from '@/components/ui-notification-content';
import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';

import styles from './styles';
import useNoticeFocus from './use-notice-focus';
import useNoticePlacement from './use-notice-placement';

const MAX_ROWS = 3;

function NoticeRow({ view, focus }: NoticeRowProps): JSX.Element {
  const { registry, release } = focus;
  const closeRef = useCallback(
    (node: HTMLButtonElement): (() => void) => {
      registry.current.set(view.id, node);
      return (): void => release(view.id, node);
    },
    [registry, release, view.id]
  );

  return (
    <li>
      <UINotificationContent view={view} onClose={focus.dismiss} closeRef={closeRef} />
    </li>
  );
}

function NoticeList({ views, focus }: NoticeListProps): JSX.Element {
  return (
    <Box component="ul" sx={styles.list}>
      {views.items.map((view) => (
        <NoticeRow key={view.id} view={view} focus={focus} />
      ))}
    </Box>
  );
}

function NoticeCard({
  views,
  bellRef,
  returnFocusRef,
  fallbackFocusRef,
  onDismiss,
}: UIBellNoticeProps): JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null);
  useNoticePlacement(bellRef, cardRef, views);
  const focus = useNoticeFocus({
    views,
    returnFocusRef,
    fallbackFocusRef,
    onDismiss,
  });
  const tone = views.items.some(({ kind }) => kind === 'error') ? 'error' : 'success';

  return (
    <Box sx={[styles.root, styles.tones[tone]]}>
      <Box sx={styles.pill} aria-hidden />
      <Box ref={cardRef} sx={styles.card}>
        <Box sx={styles.caret} aria-hidden />
        <Box sx={styles.body}>
          <NoticeList views={views} focus={focus} />
        </Box>
      </Box>
    </Box>
  );
}

export default function UIBellNotice({
  views,
  bellRef,
  returnFocusRef,
  fallbackFocusRef,
  onDismiss,
}: UIBellNoticeProps): JSX.Element | null {
  const rows = useMemo(
    (): NotificationViewSet => ({ items: views.items.slice(-MAX_ROWS) }),
    [views]
  );

  return rows.items.length === 0 ? null : (
    <NoticeCard
      views={rows}
      bellRef={bellRef}
      returnFocusRef={returnFocusRef}
      fallbackFocusRef={fallbackFocusRef}
      onDismiss={onDismiss}
    />
  );
}
