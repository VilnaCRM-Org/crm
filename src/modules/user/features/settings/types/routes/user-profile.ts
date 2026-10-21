import type { RefObject } from 'react';

import type { ToastQueue } from '@/components/types/ui-toast';

export interface SettingsHeadingProps {
  readonly headingRef: RefObject<HTMLElement | null>;
}

export interface SettingsToastsProps {
  readonly queue: ToastQueue;
  readonly saveRef: RefObject<HTMLElement | null>;
  readonly headingRef: RefObject<HTMLElement | null>;
}
