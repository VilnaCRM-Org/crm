import type { JSX } from 'react';

import type { UINotificationSlotProps } from '@/components/types/ui-notification-slot';
import UIInlineStatus from '@/components/ui-inline-status';
import useNotificationSurface from '@/hooks/use-notification-surface';

import useSlotViews from './use-slot-views';

const EMAIL_ANCHOR = 'email';

export default function UINotificationSlot({
  anchor,
}: UINotificationSlotProps): JSX.Element | null {
  const active = useNotificationSurface('anchor');
  const views = useSlotViews(anchor);

  if (!active) {
    return null;
  }

  return <UIInlineStatus views={views} placement={anchor === EMAIL_ANCHOR ? 'email' : 'actions'} />;
}
