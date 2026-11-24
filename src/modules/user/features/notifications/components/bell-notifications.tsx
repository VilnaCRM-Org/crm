import Box from '@mui/material/Box';
import type { TFunction } from 'i18next';
import { type JSX, Suspense, useId } from 'react';
import { useTranslation } from 'react-i18next';

import HeaderIconButton from '@/components/ui-app-header/header-icon-button';
import useBellAnchor from '@/components/ui-bell-notice/use-bell-anchor';
import UINotificationHistoryFrame from '@/components/ui-notification-history/history-frame';
import i18n from '@/i18n';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';

import useBellDisclosure from '../hooks/use-bell-disclosure';
import useNotificationHistory from '../hooks/use-notification-history';
import useRetryableChunk from '../hooks/use-retryable-chunk';
import en from '../i18n/en.json';
import uk from '../i18n/uk.json';
import type {
  BellButtonProps,
  BellHistoryProps,
  BellNotificationsProps,
  LazyBellNoticeProps,
} from '../types/components';

import bellOutcomeNoticeLoader from './bell-outcome-notice-loader';
import notificationHistoryPanelLoader from './notification-history-panel-loader';

lazyCatalogLoader.register(i18n, { en, uk });

const STYLES = {
  wrapper: { position: 'relative', width: '100%', height: '100%' },
  noticePlaceholder: { display: 'block', width: 0, height: 0 },
} as const;

function unreadDescription(t: TFunction, unread: number): string | undefined {
  return unread > 0 ? t('notification_center.bell.unread_count', { count: unread }) : undefined;
}

function BellButton({ layout, unread, historyId, disclosure }: BellButtonProps): JSX.Element {
  const { t } = useTranslation();
  useBellAnchor(disclosure.bell);

  return (
    <HeaderIconButton
      layout={layout}
      kind="notifications"
      count={unread}
      disclosure={{
        expanded: disclosure.expanded,
        controls: historyId,
        describedBy: unreadDescription(t, unread),
        onToggle: disclosure.toggle,
        buttonRef: disclosure.bell,
      }}
    />
  );
}

function LazyBellNotice({
  bellRef,
  hidden,
  revision,
  onChunkFailure,
}: LazyBellNoticeProps): JSX.Element | null {
  const Notice = useRetryableChunk({
    loader: bellOutcomeNoticeLoader,
    onChunkFailure,
    attempt: revision,
  });

  return hidden ? null : (
    <Suspense fallback={<Box component="span" aria-hidden="true" sx={STYLES.noticePlaceholder} />}>
      <Notice bellRef={bellRef} />
    </Suspense>
  );
}

function BellHistory({
  id,
  disclosure,
  records,
  onMarkAllRead,
  onChunkFailure,
}: BellHistoryProps): JSX.Element {
  const HistoryPanel = useRetryableChunk({
    loader: notificationHistoryPanelLoader,
    onChunkFailure,
    attempt: disclosure.opens,
  });

  return (
    <UINotificationHistoryFrame id={id} open={disclosure.expanded}>
      {disclosure.visited && <HistoryPanel records={records} onMarkAllRead={onMarkAllRead} />}
    </UINotificationHistoryFrame>
  );
}

export default function BellNotifications({
  layout,
  revision,
  onChunkFailure,
}: BellNotificationsProps): JSX.Element {
  const historyId = useId();
  const { records, unread, markAllRead } = useNotificationHistory(revision, onChunkFailure);
  const disclosure = useBellDisclosure(layout);

  return (
    <Box
      ref={disclosure.wrapper}
      onKeyDown={disclosure.keyDown}
      onBlur={disclosure.focusOut}
      sx={STYLES.wrapper}
    >
      <BellButton layout={layout} unread={unread} historyId={historyId} disclosure={disclosure} />
      <BellHistory
        id={historyId}
        disclosure={disclosure}
        records={records}
        onMarkAllRead={markAllRead}
        onChunkFailure={onChunkFailure}
      />
      <LazyBellNotice
        bellRef={disclosure.bell}
        hidden={disclosure.expanded}
        revision={revision}
        onChunkFailure={onChunkFailure}
      />
    </Box>
  );
}
