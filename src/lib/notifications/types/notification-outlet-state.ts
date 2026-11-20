import type { RefObject } from 'react';

import type { NotificationAnchor, NotificationMessageKey } from './notification-draft';
import type { ShownNotificationSet } from './shown-notification';

export interface NotificationAnnouncement {
  readonly polite: string;
  readonly assertive: string;
}

export interface NotificationInlineBatch {
  readonly anchor: NotificationAnchor;
  readonly batch: number;
}

export interface NotificationInlineBatchSet {
  readonly items: readonly NotificationInlineBatch[];
}

export interface NotificationFocusReturn {
  readonly primary: RefObject<HTMLElement | null>;
  readonly fallback?: RefObject<HTMLElement | null> | undefined;
}

export interface NotificationOutletState {
  readonly shown: ShownNotificationSet;
  readonly raised: ShownNotificationSet;
  readonly inline: NotificationInlineBatchSet;
  readonly announcement: NotificationAnnouncement;
  readonly focus: NotificationFocusReturn | null;
  readonly revision: number;
  readonly nextId: number;
  readonly nextBatch: number;
  readonly marked: boolean;
}

export type NotificationTranslate = (key: NotificationMessageKey) => string;

export type NotificationClock = () => number;
