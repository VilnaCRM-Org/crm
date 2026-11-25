import type { ComponentType, RefObject } from 'react';

import type { ShellLayout } from '@/components/types/ui-app-shell';
import type { ShellChunkFailureHandler, ShellSlotProps } from '@/routes/types/shell-slot';

import type { BellDisclosure } from './bell-disclosure';
import type { NotificationRecordSet } from './notification-record';

export type NotificationChunkReporter = ShellChunkFailureHandler;

export interface NotificationChunkModule<TProps> {
  readonly default: ComponentType<TProps>;
}

export interface NotificationChunkSource<TProps> {
  readonly load: (report: NotificationChunkReporter) => Promise<NotificationChunkModule<TProps>>;
}

export interface RetryableChunkOptions<TProps> {
  readonly loader: NotificationChunkSource<TProps>;
  readonly onChunkFailure: NotificationChunkReporter;
  readonly attempt: number;
}

export interface RetryableChunkLoad<TProps> {
  readonly failed: RefObject<boolean>;
  readonly load: () => Promise<NotificationChunkModule<TProps>>;
}

export interface NotificationHistoryPanelProps {
  readonly records: NotificationRecordSet;
  readonly onMarkAllRead: () => void;
}

export type NotificationHistoryPanelModule = NotificationChunkModule<NotificationHistoryPanelProps>;

export interface BellOutcomeNoticeProps {
  readonly bellRef: RefObject<HTMLElement | null>;
}

export type BellOutcomeNoticeModule = NotificationChunkModule<BellOutcomeNoticeProps>;

export interface BellNotificationsProps {
  readonly layout: ShellLayout;
  readonly revision: number;
  readonly onChunkFailure: ShellChunkFailureHandler;
}

export interface LazyBellNoticeProps extends BellOutcomeNoticeProps {
  readonly hidden: boolean;
  readonly revision: number;
  readonly onChunkFailure: ShellChunkFailureHandler;
}

export interface BellButtonProps {
  readonly layout: ShellLayout;
  readonly unread: number;
  readonly historyId: string;
  readonly disclosure: BellDisclosure;
}

export interface BellHistoryProps extends NotificationHistoryPanelProps {
  readonly id: string;
  readonly disclosure: BellDisclosure;
  readonly onChunkFailure: ShellChunkFailureHandler;
}

export type NotificationsShellSlotProps = ShellSlotProps;

export type SessionNotificationsProps = Pick<ShellSlotProps, 'layout' | 'onChunkFailure'>;
