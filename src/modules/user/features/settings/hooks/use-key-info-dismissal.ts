import { type RefObject, useEffect } from 'react';

import type { KeyInfoDismissal } from '../types/hooks/key-info-tooltip';

function escapeListener({ onEscape }: KeyInfoDismissal): (event: KeyboardEvent) => void {
  return (event) => {
    if (event.key === 'Escape') onEscape();
  };
}

function outsideListener(
  anchorRef: RefObject<HTMLElement | null>,
  { onOutside }: KeyInfoDismissal
): (event: PointerEvent) => void {
  return (event) => {
    if (!anchorRef.current?.contains(event.target as Node)) onOutside();
  };
}

function listen(anchorRef: RefObject<HTMLElement | null>, dismissal: KeyInfoDismissal): () => void {
  const onKeyDown = escapeListener(dismissal);
  const onPointerDown = outsideListener(anchorRef, dismissal);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('pointerdown', onPointerDown);

  return (): void => {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('pointerdown', onPointerDown);
  };
}

export default function useKeyInfoDismissal(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  dismissal: KeyInfoDismissal
): void {
  useEffect(() => (open ? listen(anchorRef, dismissal) : undefined), [open, anchorRef, dismissal]);
}
