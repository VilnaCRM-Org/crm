import { type RefCallback, useLayoutEffect, useRef } from 'react';

import type { ToastItem, ToastItemSet } from '@/components/types/ui-toast';
import type {
  CloseButtons,
  LostFocus,
  ToastFocus,
  ToastFocusOptions,
} from '@/components/types/ui-toast/toast-focus';

const HOLDS_FOCUS = ':focus, :focus ~ *';

function focusable(element: HTMLElement | null): HTMLElement | null {
  return element?.isConnected && !element.matches(':disabled') ? element : null;
}

function closeOf(buttons: CloseButtons, toast: ToastItem | undefined): HTMLElement | undefined {
  return toast === undefined ? undefined : buttons.current.get(toast.id);
}

function dismissTarget(
  buttons: CloseButtons,
  options: ToastFocusOptions,
  id: number
): HTMLElement | null | undefined {
  const { items } = options.toasts;
  const index = items.findIndex((toast) => toast.id === id);
  return (
    closeOf(buttons, items[index + 1] ?? items[index - 1]) ??
    focusable(options.returnFocusRef.current) ??
    options.fallbackFocusRef?.current
  );
}

function closeRefFor(
  buttons: CloseButtons,
  lostFocus: LostFocus,
  id: number
): RefCallback<HTMLButtonElement> {
  return (node: HTMLButtonElement) => {
    buttons.current.set(id, node);
    return (): void => {
      if (node.matches(HOLDS_FOCUS)) lostFocus.current.add(id);
      buttons.current.delete(id);
    };
  };
}

function useEvictedFocus(buttons: CloseButtons, lostFocus: LostFocus, toasts: ToastItemSet): void {
  useLayoutEffect(() => {
    const lost = lostFocus.current.size > 0;
    lostFocus.current.clear();
    if (lost && document.activeElement === document.body) {
      closeOf(buttons, toasts.items[toasts.items.length - 1])?.focus();
    }
  }, [buttons, lostFocus, toasts]);
}

export default function useToastFocus(options: ToastFocusOptions): ToastFocus {
  const closeButtons = useRef(new Map<number, HTMLButtonElement>());
  const lostFocus = useRef(new Set<number>());
  useEvictedFocus(closeButtons, lostFocus, options.toasts);

  return {
    closeRef: (id: number): RefCallback<HTMLButtonElement> =>
      closeRefFor(closeButtons, lostFocus, id),
    dismiss: (id: number): void => {
      dismissTarget(closeButtons, options, id)?.focus();
      options.onDismiss(id);
    },
  };
}
