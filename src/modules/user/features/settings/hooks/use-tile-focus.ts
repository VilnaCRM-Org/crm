import { useLayoutEffect, useState } from 'react';

import type { TileFocus } from '../types/components/social-networks';
import TileFocusHandler from '../utils/tile-focus-handler';

export default function useTileFocus(linked: boolean): TileFocus {
  const [handler] = useState(() => new TileFocusHandler());
  useLayoutEffect(() => handler.restore(), [handler, linked]);

  return handler;
}
