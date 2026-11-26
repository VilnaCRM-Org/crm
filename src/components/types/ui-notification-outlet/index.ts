import type { RefObject } from 'react';

export type NotificationOutletTarget = RefObject<HTMLElement | null>;

export interface UINotificationOutletProps {
  readonly returnFocusRef: NotificationOutletTarget;
  readonly fallbackFocusRef?: NotificationOutletTarget | undefined;
}
