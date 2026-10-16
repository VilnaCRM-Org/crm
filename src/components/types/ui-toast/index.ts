import type { RefObject } from 'react';

export type ToastTone = 'success' | 'error';

export type ToastDismiss = (id: number) => void;

export interface ToastAction {
  readonly label: string;
  readonly onActivate: () => void;
}

export interface ToastDraft {
  readonly tone: ToastTone;
  readonly message: string;
  readonly action?: ToastAction | undefined;
}

export interface ToastItem extends ToastDraft {
  readonly id: number;
}

export interface ToastDraftSet {
  readonly items: readonly ToastDraft[];
}

export interface ToastItemSet {
  readonly items: readonly ToastItem[];
}

export interface UIToastProps {
  readonly toast: ToastItem;
  readonly onDismiss: ToastDismiss;
}

export interface UIToastStackProps {
  readonly toasts: ToastItemSet;
  readonly announcement: string;
  readonly onDismiss: ToastDismiss;
  readonly returnFocusRef: RefObject<HTMLElement | null>;
}

export interface ToastQueue {
  readonly toasts: ToastItemSet;
  readonly announcement: string;
  show(drafts: ToastDraftSet): void;
  dismiss(id: number): void;
}
