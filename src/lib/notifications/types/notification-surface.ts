import type { NotificationStyle } from '@/config/runtime/types/notification-style';

export type NotificationSurface = 'page' | 'anchor' | 'header';

export type NotificationSurfaceTable = {
  readonly [Style in NotificationStyle]: NotificationSurface;
};
