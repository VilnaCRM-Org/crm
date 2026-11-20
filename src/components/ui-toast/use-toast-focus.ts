import { type RefCallback, useLayoutEffect, useRef } from 'react';

import type {
  CloseButtons,
  CloseRefCallbacks,
  LostFocus,
  ToastFocus,
  ToastFocusOptions,
  ToastFocusRegistry,
} from '@/components/types/ui-toast/toast-focus';
import type {
  NotificationView,
  NotificationViewSet,
} from '@/lib/notifications/types/notification-view';

const HOLDS_FOCUS = ':focus, :focus ~ *';

function rendered(element: HTMLElement): boolean {
  let node: Element | null = element;
  while (node !== null) {
    if (window.getComputedStyle(node).display === 'none') return false;
    node = node.parentElement;
  }
  return window.getComputedStyle(element).visibility !== 'hidden';
}

function focusable(element: HTMLElement | null): HTMLElement | null {
  const usable =
    element?.isConnected &&
    !element.matches(':disabled') &&
    element.closest('[inert]') === null &&
    rendered(element);
  return usable ? element : null;
}

function closeOf(
  buttons: CloseButtons,
  toast: NotificationView | undefined
): HTMLElement | undefined {
  return toast === undefined ? undefined : buttons.current.get(toast.id);
}

function dismissTarget(
  buttons: CloseButtons,
  options: ToastFocusOptions,
  id: string
): HTMLElement | null | undefined {
  const { items } = options.toasts;
  const index = items.findIndex((toast) => toast.id === id);
  if (index < 0) return undefined;
  return (
    closeOf(buttons, items[index + 1] ?? items[index - 1]) ??
    focusable(options.focus?.primary.current ?? null) ??
    options.focus?.fallback?.current
  );
}

function detachOf(registry: ToastFocusRegistry, id: string, node: HTMLButtonElement): () => void {
  return (): void => {
    if (node.matches(HOLDS_FOCUS)) registry.lostFocus.current.add(id);
    registry.buttons.current.delete(id);
    registry.callbacks.current.delete(id);
  };
}

function closeRefFor(registry: ToastFocusRegistry, id: string): RefCallback<HTMLButtonElement> {
  const known = registry.callbacks.current.get(id);
  if (known !== undefined) return known;
  const callback = (node: HTMLButtonElement): (() => void) => {
    registry.buttons.current.set(id, node);
    registry.callbacks.current.set(id, callback);
    return detachOf(registry, id, node);
  };
  return callback;
}

function useEvictedFocus(
  buttons: CloseButtons,
  lostFocus: LostFocus,
  toasts: NotificationViewSet
): void {
  useLayoutEffect(() => {
    const lost = lostFocus.current.size > 0;
    lostFocus.current.clear();
    if (lost && document.activeElement === document.body) {
      closeOf(buttons, toasts.items[toasts.items.length - 1])?.focus();
    }
  }, [buttons, lostFocus, toasts]);
}

export default function useToastFocus(options: ToastFocusOptions): ToastFocus {
  const buttons: CloseButtons = useRef(new Map<string, HTMLButtonElement>());
  const lostFocus: LostFocus = useRef(new Set<string>());
  const callbacks: CloseRefCallbacks = useRef(new Map<string, RefCallback<HTMLButtonElement>>());
  useEvictedFocus(buttons, lostFocus, options.toasts);

  return {
    closeRef: (id: string): RefCallback<HTMLButtonElement> =>
      closeRefFor({ buttons, lostFocus, callbacks }, id),
    dismiss: (id: string): void => {
      dismissTarget(buttons, options, id)?.focus();
      options.onDismiss(id);
    },
  };
}
