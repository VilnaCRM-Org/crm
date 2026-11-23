import Box from '@mui/material/Box';
import type { TFunction } from 'i18next';
import {
  type ComponentType,
  type JSX,
  lazy,
  type LazyExoticComponent,
  Suspense,
  useId,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import HeaderIconButton from '@/components/ui-app-header/header-icon-button';
import useBellAnchor from '@/components/ui-bell-notice/use-bell-anchor';
import UINotificationHistoryFrame from '@/components/ui-notification-history/history-frame';
import useNotificationSurface from '@/hooks/use-notification-surface';
import i18n from '@/i18n';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';
import type { ShellChunkFailureHandler } from '@/routes/types/shell-slot';

import useBellDisclosure from '../hooks/use-bell-disclosure';
import useNotificationHistory from '../hooks/use-notification-history';
import en from '../i18n/en.json';
import uk from '../i18n/uk.json';
import type {
  BellButtonProps,
  BellNotificationsProps,
  LazyBellNoticeProps,
  NotificationHistoryPanelProps,
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

function useHistoryPanelChunk(
  onChunkFailure: ShellChunkFailureHandler
): LazyExoticComponent<ComponentType<NotificationHistoryPanelProps>> {
  const [HistoryPanel] = useState(() =>
    lazy(() => notificationHistoryPanelLoader.load(onChunkFailure))
  );

  return HistoryPanel;
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

function LazyBellNotice({ bellRef, onChunkFailure }: LazyBellNoticeProps): JSX.Element {
  const [Notice] = useState(() => lazy(() => bellOutcomeNoticeLoader.load(onChunkFailure)));

  return (
    <Suspense fallback={<Box component="span" aria-hidden="true" sx={STYLES.noticePlaceholder} />}>
      <Notice bellRef={bellRef} />
    </Suspense>
  );
}

export default function BellNotifications({
  layout,
  revision,
  onChunkFailure,
}: BellNotificationsProps): JSX.Element {
  const historyId = useId();
  const { records, unread, markAllRead } = useNotificationHistory(revision);
  const disclosure = useBellDisclosure(layout);
  const showsNotice = useNotificationSurface('header');
  const HistoryPanel = useHistoryPanelChunk(onChunkFailure);

  return (
    <Box
      ref={disclosure.wrapper}
      onKeyDown={disclosure.keyDown}
      onBlur={disclosure.focusOut}
      sx={STYLES.wrapper}
    >
      <BellButton layout={layout} unread={unread} historyId={historyId} disclosure={disclosure} />
      <UINotificationHistoryFrame id={historyId} open={disclosure.expanded}>
        {disclosure.visited && <HistoryPanel records={records} onMarkAllRead={markAllRead} />}
      </UINotificationHistoryFrame>
      {showsNotice && <LazyBellNotice bellRef={disclosure.bell} onChunkFailure={onChunkFailure} />}
    </Box>
  );
}
