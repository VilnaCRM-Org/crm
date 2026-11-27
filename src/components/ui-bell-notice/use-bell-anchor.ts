import { useCallback, useLayoutEffect } from 'react';

import type { BellAnchorMoment, NoticeTargetRef } from '@/components/types/ui-bell-notice';

import useMeasureOnResize from './use-measure-on-resize';

const CENTRE_PROPERTY = '--bell-centre-x';

const BOTTOM_PROPERTY = '--bell-bottom';

function place(bellRef: NoticeTargetRef): void {
  const rect = bellRef.current?.getBoundingClientRect();
  if (rect === undefined) {
    return;
  }
  const { style } = document.documentElement;
  style.setProperty(CENTRE_PROPERTY, `${rect.left + rect.width / 2}px`);
  style.setProperty(BOTTOM_PROPERTY, `${rect.bottom}px`);
}

function release(): void {
  const { style } = document.documentElement;
  style.removeProperty(CENTRE_PROPERTY);
  style.removeProperty(BOTTOM_PROPERTY);
}

export default function useBellAnchor(
  bellRef: NoticeTargetRef,
  { expanded, rows }: BellAnchorMoment
): void {
  const measure = useCallback((): void => place(bellRef), [bellRef]);
  useMeasureOnResize(measure, release);
  useLayoutEffect(measure, [measure, expanded, rows]);
}
