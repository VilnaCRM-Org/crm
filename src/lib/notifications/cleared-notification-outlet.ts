import type { NotificationOutletState } from './types/notification-outlet-state';
import type { ShownNotificationSet } from './types/shown-notification';

const EMPTY_SHOWN: ShownNotificationSet = Object.freeze({ items: Object.freeze([]) });

const CLEARED_NOTIFICATION_OUTLET: NotificationOutletState = Object.freeze({
  shown: EMPTY_SHOWN,
  raised: EMPTY_SHOWN,
  announcement: Object.freeze({ polite: '', assertive: '' }),
  focus: null,
  revision: 0,
  nextId: 1,
  marked: false,
});

export default CLEARED_NOTIFICATION_OUTLET;
