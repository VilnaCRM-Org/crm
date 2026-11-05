import { useLayoutEffect } from 'react';

import type { SettledFocusOptions } from '../types/hooks/use-settled-focus';

function settledTarget(
  target: HTMLElement | null,
  form: HTMLFormElement | null | undefined,
  heading: HTMLElement | null
): HTMLElement | null {
  const active = document.activeElement;
  const onBody = active === document.body;
  if (target?.matches(':disabled')) return onBody ? heading : null;
  return onBody || form?.contains(active) ? target : null;
}

export default function useSettledFocus(options: SettledFocusOptions): void {
  const { state, section, buttonRef, saveRef, headingRef } = options;
  const { settled, lastSettleSaved } = state;

  useLayoutEffect(() => {
    if (settled === 0) return;
    const button = buttonRef.current;
    const collapsed = lastSettleSaved && section !== 'password';
    const target = collapsed ? document.getElementById(section) : button;
    saveRef.current = target;
    settledTarget(target, button?.form, headingRef.current)?.focus();
  }, [settled, lastSettleSaved, section, buttonRef, saveRef, headingRef]);
}
