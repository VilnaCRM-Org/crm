import type { JSX } from 'react';

import type { HeaderBellProps } from '@/components/types/ui-app-header';

import BellSlotFrame from './bell-slot-frame';
import HeaderIconButton from './header-icon-button';

export default function HeaderBell({ layout, count, children }: HeaderBellProps): JSX.Element {
  if (children === undefined) {
    return <HeaderIconButton layout={layout} kind="notifications" count={count} />;
  }

  return <BellSlotFrame layout={layout}>{children}</BellSlotFrame>;
}
