import type { RefCallback, RefObject } from 'react';

import type { ToastDismiss, ToastItemSet } from './index';

export type CloseButtons = RefObject<Map<number, HTMLButtonElement>>;

export type LostFocus = RefObject<Set<number>>;

export type CloseRefCallbacks = RefObject<Map<number, RefCallback<HTMLButtonElement>>>;

export interface ToastFocusRegistry {
  readonly buttons: CloseButtons;
  readonly lostFocus: LostFocus;
  readonly callbacks: CloseRefCallbacks;
}

export interface ToastFocusOptions {
  readonly toasts: ToastItemSet;
  readonly returnFocusRef: RefObject<HTMLElement | null>;
  readonly fallbackFocusRef?: RefObject<HTMLElement | null> | undefined;
  readonly onDismiss: ToastDismiss;
}

export interface ToastFocus {
  readonly dismiss: ToastDismiss;
  closeRef(id: number): RefCallback<HTMLButtonElement>;
}

export type ToastIconName = 'check' | 'alert' | 'close';

export interface ToastIconProps {
  readonly name: ToastIconName;
}
