import type { ComponentType, RefObject } from 'react';

import type { ShellLayout } from '@/components/types/ui-app-shell';
import type {
  ShellChunkFailureHandler,
  ShellChunkSource,
  ShellSlotProps,
} from '@/routes/types/shell-slot';

import type { BellDisclosure } from './bell-disclosure';
import type { NotificationRecordSet } from './notification-record';

export type NotificationChunkReporter = (source: ShellChunkSource, error: unknown) => void;

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

export interface BellNotificationsProps {
  readonly layout: ShellLayout;
  readonly revision: number;
  readonly onChunkFailure: ShellChunkFailureHandler;
}

export interface LazyBellNoticeProps extends BellOutcomeNoticeProps {
  readonly onChunkFailure: ShellChunkFailureHandler;
}

export interface BellButtonProps {
  readonly layout: ShellLayout;
  readonly unread: number;
  readonly historyId: string;
  readonly disclosure: BellDisclosure;
}

export type NotificationsShellSlotProps = ShellSlotProps;
