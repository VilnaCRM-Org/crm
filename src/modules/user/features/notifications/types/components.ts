import type { ComponentType, RefObject } from 'react';

import type { NotificationRecordSet } from './notification-record';

export type NotificationChunkReporter = (source: string, error: unknown) => void;

export interface NotificationHistoryPanelProps {
  readonly records: NotificationRecordSet;
  readonly onMarkAllRead: () => void;
}

export interface NotificationHistoryPanelModule {
  readonly default: ComponentType<NotificationHistoryPanelProps>;
}

export interface BellOutcomeNoticeProps {
  readonly bellRef: RefObject<HTMLElement | null>;
}

export interface BellOutcomeNoticeModule {
  readonly default: ComponentType<BellOutcomeNoticeProps>;
}
