import { type RefObject, useCallback, useLayoutEffect, useRef } from 'react';

import type {
  NoticeCloseRegistry,
  NoticeFocus,
  NoticeFocusOptions,
  NoticeFocusTargets,
  NoticeRelease,
  NoticeTargetRef,
} from '@/components/types/ui-bell-notice';
import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';

function usable(ref: NoticeTargetRef | undefined): HTMLElement | undefined {
  const element = ref?.current;
  return element?.isConnected && !element.matches(':disabled') ? element : undefined;
}

function dismissTarget(
  buttons: Map<string, HTMLButtonElement>,
  targets: NoticeFocusTargets,
  id: string
): HTMLElement | undefined {
  const { items } = targets.views;
  const index = items.findIndex((view) => view.id === id);
  if (index < 0) {
    return undefined;
  }
  const next = items[index + 1] ?? items[index - 1];
  return (
    (next === undefined ? undefined : buttons.get(next.id)) ??
    usable(targets.returnFocusRef) ??
    usable(targets.fallbackFocusRef)
  );
}

function useShownViews(views: NotificationViewSet): RefObject<NotificationViewSet> {
  const shown = useRef(views);
  useLayoutEffect(() => {
    shown.current = views;
  }, [views]);
  return shown;
}

function useRelease(
  registry: NoticeCloseRegistry,
  shown: RefObject<NotificationViewSet>,
  { returnFocusRef, fallbackFocusRef }: NoticeFocusOptions
): NoticeRelease {
  return useCallback(
    (id: string, node: HTMLButtonElement): void => {
      const row = node.closest('li') ?? node;
      if (row.contains(node.ownerDocument.activeElement)) {
        const targets = { views: shown.current, returnFocusRef, fallbackFocusRef };
        dismissTarget(registry.current, targets, id)?.focus();
      }
      registry.current.delete(id);
    },
    [registry, shown, returnFocusRef, fallbackFocusRef]
  );
}

export default function useNoticeFocus(options: NoticeFocusOptions): NoticeFocus {
  const registry = useRef(new Map<string, HTMLButtonElement>());
  const { views, returnFocusRef, fallbackFocusRef, onDismiss } = options;
  const release = useRelease(registry, useShownViews(views), options);

  const dismiss = useCallback(
    (id: string): void => {
      dismissTarget(registry.current, { views, returnFocusRef, fallbackFocusRef }, id)?.focus();
      onDismiss(id);
    },
    [views, returnFocusRef, fallbackFocusRef, onDismiss]
  );

  return { registry, dismiss, release };
}
