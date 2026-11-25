import { useCallback } from 'react';

import layoutStyles from '@/components/layouts/app-layout.styles';
import type { NoticeTargetRef } from '@/components/types/ui-bell-notice';
import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';

import useContentShift from './use-content-shift';
import useFrameFollow from './use-frame-follow';
import useMeasureOnResize from './use-measure-on-resize';

const HEADER_HEIGHT = parseFloat(layoutStyles.headerHeight);

function release(): void {
  document.documentElement.style.removeProperty(layoutStyles.overhangProperty);
}

function hiddenBy(area: DOMRect, { bottom, left, right }: DOMRect): boolean {
  const within = left >= area.left && right <= area.right;

  return within && bottom > HEADER_HEIGHT && bottom <= area.bottom;
}

function heldByKeyboardOnPage(element: HTMLElement): boolean {
  return element.matches(':focus-visible') && element.matches('main *, footer *');
}

function revealCovered(area: DOMRect): void {
  const { activeElement } = document;
  if (!(activeElement instanceof HTMLElement) || !heldByKeyboardOnPage(activeElement)) {
    return;
  }
  const held = activeElement.getBoundingClientRect();
  if (hiddenBy(area, held)) {
    window.scrollBy({ top: -Math.ceil(area.bottom - held.top) });
  }
}

function measureOverhang(card: HTMLElement | null): void {
  if (card === null) {
    release();
    return;
  }
  const area = card.getBoundingClientRect();
  const overhang = `${Math.max(0, area.bottom - HEADER_HEIGHT)}px`;
  document.documentElement.style.setProperty(layoutStyles.overhangProperty, overhang);
  revealCovered(area);
}

export default function useNoticeClearance(
  cardRef: NoticeTargetRef,
  rows: NotificationViewSet
): () => void {
  const measure = useCallback((): void => measureOverhang(cardRef.current), [cardRef]);
  useMeasureOnResize(measure, release, rows);
  useFrameFollow('focusin', measure);
  useContentShift(measure);

  return measure;
}
