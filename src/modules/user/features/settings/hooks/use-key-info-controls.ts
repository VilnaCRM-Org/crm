import { useState } from 'react';

import type { KeyInfoTooltipHandlers, KeyInfoUpdate } from '../types/hooks/key-info-tooltip';

function handlersOf(update: KeyInfoUpdate): KeyInfoTooltipHandlers {
  return {
    onMouseEnter: (): void => update({ hovered: true }),
    onMouseLeave: (): void => update({ hovered: false }),
    onFocus: (): void => update({ engaged: true }),
    onBlur: (): void => update({ engaged: false }),
    onClick: (): void => update({ engaged: true, dismissed: false }),
  };
}

export default function useKeyInfoControls(update: KeyInfoUpdate): KeyInfoTooltipHandlers {
  const [handlers] = useState(() => handlersOf(update));

  return handlers;
}
