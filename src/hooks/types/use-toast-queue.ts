import type { ToastDraftSet, ToastItemSet } from '@/components/types/ui-toast';

export interface ToastQueueState {
  readonly toasts: ToastItemSet;
  readonly announcement: string;
  readonly nextId: number;
  readonly marked: boolean;
}

export interface ShowToastsAction {
  readonly type: 'show';
  readonly drafts: ToastDraftSet;
}

export interface DismissToastAction {
  readonly type: 'dismiss';
  readonly id: number;
}

export type ToastQueueAction = ShowToastsAction | DismissToastAction;
