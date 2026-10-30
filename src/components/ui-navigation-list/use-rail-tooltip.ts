import { useReducer, useState } from 'react';

import type {
  RailTooltipBehavior,
  RailTooltipChange,
  RailTooltipControls,
  RailTooltipState,
  RailTooltipUpdate,
} from '@/components/types/ui-navigation-list';

import useDocumentEscape from './use-document-escape';

const LEFT: RailTooltipState = { hovered: false, focused: false, dismissed: false };

function railTooltipReducer(
  previous: RailTooltipState,
  change: RailTooltipChange
): RailTooltipState {
  const next = { ...previous, ...change };

  return next.hovered || next.focused ? next : LEFT;
}

function railTooltipControls(update: RailTooltipUpdate): RailTooltipControls {
  return {
    handlers: {
      onMouseEnter: (): void => update({ hovered: true }),
      onMouseLeave: (): void => update({ hovered: false }),
      onFocus: (): void => update({ focused: true }),
      onBlur: (): void => update({ focused: false }),
    },
    dismiss: (): void => update({ dismissed: true }),
  };
}

export default function useRailTooltip(): RailTooltipBehavior {
  const [state, update] = useReducer(railTooltipReducer, LEFT);
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [{ handlers, dismiss }] = useState(() => railTooltipControls(update));
  const visible = (state.hovered || state.focused) && !state.dismissed;

  useDocumentEscape(visible, dismiss);

  return { visible, anchor: visible ? element : null, ref: setElement, handlers };
}
