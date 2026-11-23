import type { NotificationRecordDraft } from './notification-record';

export interface BroadcastEvent {
  readonly id: string;
  readonly draft: NotificationRecordDraft;
}

export interface BroadcastEventReader {
  parse(text: string): BroadcastEvent | null;
}

export type BroadcastEventReceiver = (draft: NotificationRecordDraft) => void;

export type BroadcastEventStop = () => void;

export interface BroadcastEventClientOptions {
  readonly base: string;
  readonly parser: BroadcastEventReader;
  readonly receive: BroadcastEventReceiver;
}
