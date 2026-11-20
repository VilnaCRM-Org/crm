import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type {
  HistoryBodyProps,
  HistoryRowProps,
  UINotificationHistoryProps,
} from '@/components/types/ui-notification-history';
import UINotificationContent from '@/components/ui-notification-content';

import styles from './styles';

function HistoryRow({ view, unread, label }: HistoryRowProps): JSX.Element {
  return (
    <Box component="li" sx={[styles.row, unread && styles.unread]}>
      {unread ? (
        <Box component="span" sx={styles.hidden}>
          {label}
        </Box>
      ) : null}
      <UINotificationContent view={view} />
      {unread ? <Box component="span" aria-hidden sx={styles.dot} /> : null}
    </Box>
  );
}

function HistoryBody({ views, unread, copy }: HistoryBodyProps): JSX.Element {
  if (views.items.length === 0) {
    return (
      <Box component="p" sx={styles.empty}>
        {copy.empty}
      </Box>
    );
  }

  return (
    <Box component="ul" sx={styles.list}>
      {views.items.map((view) => (
        <HistoryRow key={view.id} view={view} unread={unread.has(view.id)} label={copy.unread} />
      ))}
    </Box>
  );
}

export default function UINotificationHistory({
  views,
  unread,
  copy,
  onMarkAllRead,
}: UINotificationHistoryProps): JSX.Element {
  return (
    <Box>
      <Box component="h2" sx={styles.heading}>
        {copy.heading}
      </Box>
      <HistoryBody views={views} unread={unread} copy={copy} />
      <Box component="button" type="button" sx={styles.markAll} onClick={onMarkAllRead}>
        {copy.markAllRead}
      </Box>
    </Box>
  );
}
