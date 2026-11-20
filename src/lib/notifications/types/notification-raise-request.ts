import type { NotificationDraftSet } from './notification-draft';
import type { NotificationOutletState, NotificationTranslate } from './notification-outlet-state';

export interface NotificationRaiseRequest {
  readonly state: NotificationOutletState;
  readonly drafts: NotificationDraftSet;
  readonly translate: NotificationTranslate;
  readonly raisedAt: number;
}
