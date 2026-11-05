import { useLayoutEffect } from 'react';

import type { SettledFocusOptions } from '../types/hooks/use-settled-focus';

export default function useSettledFocus(options: SettledFocusOptions): void {
  const { state, section, buttonRef, saveRef } = options;
  const { settled, lastSettleSaved } = state;

  useLayoutEffect(() => {
    if (settled === 0) return;
    const button = buttonRef.current;
    const collapsed = lastSettleSaved && section !== 'password';
    const target = collapsed ? document.getElementById(section) : button;
    const active = document.activeElement;
    saveRef.current = target;
    if (active === document.body || button?.form?.contains(active)) target?.focus();
  }, [settled, lastSettleSaved, section, buttonRef, saveRef]);
}
