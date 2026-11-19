import { useReducer, useRef, useState } from 'react';

import type {
  KeyInfoChange,
  KeyInfoDismissal,
  KeyInfoTooltip,
  KeyInfoTooltipState,
  KeyInfoUpdate,
} from '../types/hooks/key-info-tooltip';

import useKeyInfoControls from './use-key-info-controls';
import useKeyInfoDismissal from './use-key-info-dismissal';

const AT_REST: KeyInfoTooltipState = { hovered: false, engaged: false, dismissed: false };

function merge(previous: KeyInfoTooltipState, change: KeyInfoChange): KeyInfoTooltipState {
  const next = { ...previous, ...change };

  return next.hovered || next.engaged ? next : AT_REST;
}

function dismissalOf(update: KeyInfoUpdate): KeyInfoDismissal {
  return {
    onEscape: (): void => update({ dismissed: true }),
    onOutside: (): void => update(AT_REST),
  };
}

export default function useKeyInfoTooltip(): KeyInfoTooltip {
  const [state, update] = useReducer(merge, AT_REST);
  const anchorRef = useRef<HTMLElement>(null);
  const handlers = useKeyInfoControls(update);
  const [dismissal] = useState(() => dismissalOf(update));
  const open = (state.hovered || state.engaged) && !state.dismissed;

  useKeyInfoDismissal(open, anchorRef, dismissal);

  return { open, anchorRef, handlers };
}
