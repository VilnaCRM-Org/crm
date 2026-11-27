import type { BellDismissal, BellDismissalOptions } from '../types/bell-disclosure';

import useBellEscape from './use-bell-escape';
import useBellFocusOut from './use-bell-focus-out';
import useBellOutsideClose from './use-bell-outside-close';

export default function useBellDismissal(options: BellDismissalOptions): BellDismissal {
  useBellEscape(options);
  useBellOutsideClose(options);
  const focusOut = useBellFocusOut(options);

  return { focusOut };
}
