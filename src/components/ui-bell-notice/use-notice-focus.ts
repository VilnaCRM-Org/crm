import { useCallback, useRef } from 'react';

import type {
  NoticeFocus,
  NoticeFocusOptions,
  NoticeTargetRef,
} from '@/components/types/ui-bell-notice';

function usable(ref: NoticeTargetRef | undefined): HTMLElement | undefined {
  const element = ref?.current;
  return element?.isConnected && !element.matches(':disabled') ? element : undefined;
}

function dismissTarget(
  buttons: Map<string, HTMLButtonElement>,
  options: NoticeFocusOptions,
  id: string
): HTMLElement | undefined {
  const { items } = options.views;
  const index = items.findIndex((view) => view.id === id);
  if (index < 0) {
    return undefined;
  }
  const next = items[index + 1] ?? items[index - 1];
  return (
    (next === undefined ? undefined : buttons.get(next.id)) ??
    usable(options.returnFocusRef) ??
    usable(options.fallbackFocusRef)
  );
}

export default function useNoticeFocus(options: NoticeFocusOptions): NoticeFocus {
  const registry = useRef(new Map<string, HTMLButtonElement>());
  const { views, returnFocusRef, fallbackFocusRef, onDismiss } = options;

  const dismiss = useCallback(
    (id: string): void => {
      dismissTarget(
        registry.current,
        { views, returnFocusRef, fallbackFocusRef, onDismiss },
        id
      )?.focus();
      onDismiss(id);
    },
    [views, returnFocusRef, fallbackFocusRef, onDismiss]
  );

  return { registry, dismiss };
}
