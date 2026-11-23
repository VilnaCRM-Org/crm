import type { RefObject } from 'react';

import type { NotificationMessageKey } from './notification-draft';
import type { ShownNotificationSet } from './shown-notification';

export interface NotificationAnnouncement {
  readonly polite: string;
  readonly assertive: string;
}

export interface NotificationFocusReturn {
  readonly primary: RefObject<HTMLElement | null>;
  readonly fallback?: RefObject<HTMLElement | null> | undefined;
}

export interface NotificationOutletState {
  readonly shown: ShownNotificationSet;
  readonly raised: ShownNotificationSet;
  readonly announcement: NotificationAnnouncement;
  readonly focus: NotificationFocusReturn | null;
  readonly revision: number;
  readonly nextId: number;
  readonly marked: boolean;
}

export type NotificationTranslate = (key: NotificationMessageKey) => string;

export type NotificationClock = () => number;
