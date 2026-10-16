import { type RefCallback, useRef } from 'react';

import type { ToastFocus, ToastFocusOptions } from '@/components/types/ui-toast/toast-focus';

export default function useToastFocus({
  toasts,
  returnFocusRef,
  onDismiss,
}: ToastFocusOptions): ToastFocus {
  const closeButtons = useRef(new Map<number, HTMLButtonElement>());

  const closeRef = (id: number): RefCallback<HTMLButtonElement> => {
    return (node) => {
      if (node) closeButtons.current.set(id, node);
      else closeButtons.current.delete(id);
    };
  };

  const dismiss = (id: number): void => {
    const next = toasts.items[toasts.items.findIndex((toast) => toast.id === id) + 1];
    const target = next ? closeButtons.current.get(next.id) : returnFocusRef.current;
    target?.focus();
    onDismiss(id);
  };

  return { closeRef, dismiss };
}
