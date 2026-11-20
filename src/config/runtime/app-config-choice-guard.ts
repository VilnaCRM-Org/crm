import { NOTIFICATION_STYLES } from './notification-styles';
import type { AppConfigChoiceKey, AppConfigChoices } from './types/app-config';

export const APP_CONFIG_CHOICE_KEYS: readonly AppConfigChoiceKey[] = Object.freeze([
  'notificationStyle',
]);

class AppConfigChoiceGuard {
  private readonly choices: AppConfigChoices = Object.freeze({
    notificationStyle: new Set<string>(NOTIFICATION_STYLES),
  });

  public choice(key: AppConfigChoiceKey, text: string | undefined): string | undefined {
    const allowed = this.choices[key];

    if (text === undefined || allowed.has(text)) {
      return text;
    }

    throw new Error(`${key} must be one of ${[...allowed].join(', ')}, got "${text}".`);
  }
}

const appConfigChoiceGuard = new AppConfigChoiceGuard();

export default appConfigChoiceGuard;
