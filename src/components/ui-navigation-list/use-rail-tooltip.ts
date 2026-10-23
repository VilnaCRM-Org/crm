import { type KeyboardEvent, useCallback, useState } from 'react';

import type { RailTooltipBehavior, RailTooltipState } from '@/components/types/ui-navigation-list';

export default function useRailTooltip(): RailTooltipBehavior {
  const [state, setState] = useState<RailTooltipState>('idle');
  const show = useCallback(
    (): void => setState((previous) => (previous === 'dismissed' ? previous : 'shown')),
    []
  );
  const hide = useCallback((): void => setState('idle'), []);
  const dismiss = useCallback((event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') setState('dismissed');
  }, []);

  return {
    visible: state === 'shown',
    handlers: {
      onMouseEnter: show,
      onMouseLeave: hide,
      onFocus: show,
      onBlur: hide,
      onKeyDown: dismiss,
    },
  };
}
