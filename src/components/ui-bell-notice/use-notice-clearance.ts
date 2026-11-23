import { useCallback } from 'react';

import layoutStyles from '@/components/layouts/app-layout.styles';
import type { NoticeTargetRef } from '@/components/types/ui-bell-notice';
import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';

import useMeasureOnResize from './use-measure-on-resize';

const HEADER_HEIGHT = parseFloat(layoutStyles.headerHeight);

function release(): void {
  document.documentElement.style.removeProperty(layoutStyles.overhangProperty);
}

function revealCovered(cardBottom: number, card: HTMLElement): void {
  const { activeElement } = document;
  if (!(activeElement instanceof HTMLElement) || card.contains(activeElement)) {
    return;
  }
  const { top } = activeElement.getBoundingClientRect();
  if (top >= HEADER_HEIGHT && top < cardBottom) {
    window.scrollBy({ top: -Math.ceil(cardBottom - top) });
  }
}

function measureOverhang(card: HTMLElement | null): void {
  if (card === null) {
    release();
    return;
  }
  const { bottom } = card.getBoundingClientRect();
  const overhang = `${Math.max(0, bottom - HEADER_HEIGHT)}px`;
  document.documentElement.style.setProperty(layoutStyles.overhangProperty, overhang);
  revealCovered(bottom, card);
}

export default function useNoticeClearance(
  cardRef: NoticeTargetRef,
  rows: NotificationViewSet
): () => void {
  const measure = useCallback((): void => measureOverhang(cardRef.current), [cardRef]);
  useMeasureOnResize(measure, release, rows);

  return measure;
}
