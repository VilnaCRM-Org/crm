import type { NotificationStyle } from './types/notification-style';

export const NOTIFICATION_STYLES = Object.freeze(['toast', 'inline', 'bell'] as const);

export const DEFAULT_NOTIFICATION_STYLE: NotificationStyle = 'toast';
