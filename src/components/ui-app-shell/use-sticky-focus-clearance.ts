import { type FocusEvent, type FocusEventHandler, useState } from 'react';

import layoutStyles from '@/components/layouts/app-layout.styles';

const HEADER_HEIGHT = parseFloat(layoutStyles.headerHeight);

const FOLLOW_UPS = 1;

function headerClearance(): number {
  const overhang = parseFloat(
    document.documentElement.style.getPropertyValue(layoutStyles.overhangProperty)
  );
  return HEADER_HEIGHT + (Number.isNaN(overhang) ? 0 : overhang);
}

function revealFocus(target: Element, followUps: number): void {
  if (target !== document.activeElement || target.getBoundingClientRect().height === 0) return;
  target.scrollIntoView({ block: 'nearest' });
  const overlap = headerClearance() - target.getBoundingClientRect().top;

  if (overlap <= 0) return;
  window.scrollBy({ top: -Math.ceil(overlap) });
  if (followUps > 0) requestAnimationFrame(() => revealFocus(target, followUps - 1));
}

export default function useStickyFocusClearance(): FocusEventHandler<HTMLDivElement> {
  const [handler] = useState(() => (event: FocusEvent<HTMLDivElement>): void => {
    const { target } = event;
    requestAnimationFrame(() => revealFocus(target, FOLLOW_UPS));
  });

  return handler;
}
