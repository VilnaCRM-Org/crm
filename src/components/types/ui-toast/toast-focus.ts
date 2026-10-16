import type { RefCallback, RefObject } from 'react';

import type { ToastDismiss, ToastItemSet } from './index';

export interface ToastFocusOptions {
  readonly toasts: ToastItemSet;
  readonly returnFocusRef: RefObject<HTMLElement | null>;
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
