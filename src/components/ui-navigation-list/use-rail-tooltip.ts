import { useCallback, useState } from 'react';

import type { RailTooltipBehavior, RailTooltipState } from '@/components/types/ui-navigation-list';

import useDocumentEscape from './use-document-escape';

export default function useRailTooltip(): RailTooltipBehavior {
  const [state, setState] = useState<RailTooltipState>('idle');
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const show = useCallback(
    (): void => setState((previous) => (previous === 'dismissed' ? previous : 'shown')),
    []
  );
  const hide = useCallback((): void => setState('idle'), []);
  const [dismiss] = useState(() => (): void => setState('dismissed'));
  const visible = state === 'shown';

  useDocumentEscape(visible, dismiss);

  return {
    visible,
    anchor: visible ? element : null,
    ref: setElement,
    handlers: {
      onMouseEnter: show,
      onMouseLeave: hide,
      onFocus: show,
      onBlur: hide,
    },
  };
}
