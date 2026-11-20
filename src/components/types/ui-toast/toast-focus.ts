import type { RefCallback, RefObject } from 'react';

import type { NotificationFocusReturn } from '@/lib/notifications/types/notification-outlet-state';
import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';

import type { ToastDismiss } from './index';

export type CloseButtons = RefObject<Map<string, HTMLButtonElement>>;

export type LostFocus = RefObject<Set<string>>;

export type CloseRefCallbacks = RefObject<Map<string, RefCallback<HTMLButtonElement>>>;

export interface ToastFocusRegistry {
  readonly buttons: CloseButtons;
  readonly lostFocus: LostFocus;
  readonly callbacks: CloseRefCallbacks;
}

export interface ToastFocusOptions {
  readonly toasts: NotificationViewSet;
  readonly focus: NotificationFocusReturn | null;
  readonly onDismiss: ToastDismiss;
}

export interface ToastFocus {
  readonly dismiss: ToastDismiss;
  closeRef(id: string): RefCallback<HTMLButtonElement>;
}
