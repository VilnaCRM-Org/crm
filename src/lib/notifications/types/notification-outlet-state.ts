import type { RefObject } from 'react';

import type { NotificationMessageKey, NotificationMessageValues } from './notification-draft';
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
  readonly recorded: number;
  readonly nextId: number;
  readonly marked: boolean;
}

export type NotificationShownPatch = Pick<NotificationOutletState, 'shown'>;

export type NotificationRecordedPatch = Pick<NotificationOutletState, 'recorded'>;

export type NotificationFocusPatch = Pick<NotificationOutletState, 'focus'>;

export type NotificationClearPatch = Pick<
  NotificationOutletState,
  'shown' | 'raised' | 'announcement' | 'focus'
>;

export type NotificationTranslate = (
  key: NotificationMessageKey,
  values: NotificationMessageValues | undefined
) => string;

export type NotificationClock = () => number;
