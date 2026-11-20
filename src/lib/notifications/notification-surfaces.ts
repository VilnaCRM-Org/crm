import type { NotificationSurfaceTable } from './types/notification-surface';

const NOTIFICATION_SURFACES: NotificationSurfaceTable = Object.freeze({
  toast: 'page',
  inline: 'anchor',
  bell: 'header',
});

export default NOTIFICATION_SURFACES;
