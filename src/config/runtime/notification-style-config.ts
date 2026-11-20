import appConfigChoiceGuard from './app-config-choice-guard';
import appConfigSource from './app-config-source';
import { DEFAULT_NOTIFICATION_STYLE, NOTIFICATION_STYLES } from './notification-styles';
import type { NotificationStyle } from './types/notification-style';

export class NotificationStyleConfig {
  public value(): NotificationStyle {
    const text = appConfigChoiceGuard.choice(
      'notificationStyle',
      appConfigSource.text('notificationStyle')
    );

    return NOTIFICATION_STYLES.find((style) => style === text) ?? DEFAULT_NOTIFICATION_STYLE;
  }
}

const notificationStyleConfig = new NotificationStyleConfig();

export default notificationStyleConfig;
