import { type RefCallback, useLayoutEffect, useRef } from 'react';

import type { ToastItem, ToastItemSet } from '@/components/types/ui-toast';
import type {
  CloseButtons,
  CloseRefCallbacks,
  LostFocus,
  ToastFocus,
  ToastFocusOptions,
  ToastFocusRegistry,
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
  if (index < 0) return undefined;
  return (
    closeOf(buttons, items[index + 1] ?? items[index - 1]) ??
    focusable(options.returnFocusRef.current) ??
    options.fallbackFocusRef?.current
  );
}

function detachOf(registry: ToastFocusRegistry, id: number, node: HTMLButtonElement): () => void {
  return (): void => {
    if (node.matches(HOLDS_FOCUS)) registry.lostFocus.current.add(id);
    registry.buttons.current.delete(id);
    registry.callbacks.current.delete(id);
  };
}

function closeRefFor(registry: ToastFocusRegistry, id: number): RefCallback<HTMLButtonElement> {
  const known = registry.callbacks.current.get(id);
  if (known !== undefined) return known;
  const callback = (node: HTMLButtonElement): (() => void) => {
    registry.buttons.current.set(id, node);
    return detachOf(registry, id, node);
  };
  registry.callbacks.current.set(id, callback);
  return callback;
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
  const buttons: CloseButtons = useRef(new Map<number, HTMLButtonElement>());
  const lostFocus: LostFocus = useRef(new Set<number>());
  const callbacks: CloseRefCallbacks = useRef(new Map<number, RefCallback<HTMLButtonElement>>());
  useEvictedFocus(buttons, lostFocus, options.toasts);

  return {
    closeRef: (id: number): RefCallback<HTMLButtonElement> =>
      closeRefFor({ buttons, lostFocus, callbacks }, id),
    dismiss: (id: number): void => {
      dismissTarget(buttons, options, id)?.focus();
      options.onDismiss(id);
    },
  };
}
