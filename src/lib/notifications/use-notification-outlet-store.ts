import { create } from 'zustand';

import { CLEARED_NOTIFICATION_OUTLET } from './cleared-notification-outlet';
import type { NotificationOutletState } from './types/notification-outlet-state';

const useNotificationOutletStore = create<NotificationOutletState>()(() => ({
  ...CLEARED_NOTIFICATION_OUTLET,
}));

export default useNotificationOutletStore;
