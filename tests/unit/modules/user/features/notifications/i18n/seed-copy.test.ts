import notificationEn from '@/modules/user/features/notifications/i18n/en.json';
import notificationUk from '@/modules/user/features/notifications/i18n/uk.json';
import { NOTIFICATION_SEED } from '@/modules/user/features/notifications/repositories';
import settingsEn from '@/modules/user/features/settings/i18n/en.json';
import settingsUk from '@/modules/user/features/settings/i18n/uk.json';

const PAIRS = [
  ['password_changed', 'notification_center.seed.password_changed'],
  ['email_sent', 'notification_center.seed.email_sent'],
  ['saved', 'notification_center.seed.saved'],
] as const;

const LOCALES = [
  ['uk', notificationUk, settingsUk],
  ['en', notificationEn, settingsEn],
] as const;

describe('notification seed copy follows the settings toasts', () => {
  it.each(
    LOCALES.flatMap(([locale, notification, settings]) =>
      PAIRS.map(([toast, key]) => [locale, toast, key, notification, settings] as const)
    )
  )('%s: settings.toasts.%s equals %s', (_locale, toast, key, notification, settings) => {
    const seedKey = key.split('.')[2] as keyof typeof notification.notification_center.seed;

    expect(notification.notification_center.seed[seedKey]).toBe(settings.settings.toasts[toast]);
    expect(notification.notification_center.seed[seedKey]).not.toBe('');
  });

  it('holds exactly the three seed keys and no others', () => {
    [notificationEn, notificationUk].forEach((catalog) => {
      expect(Object.keys(catalog)).toEqual(['notification_center']);
      expect(Object.keys(catalog.notification_center)).toEqual(['seed']);
      expect(Object.keys(catalog.notification_center.seed).sort()).toEqual([
        'email_sent',
        'password_changed',
        'saved',
      ]);
    });
  });

  it('resolves every seed message key in both locales', () => {
    NOTIFICATION_SEED.items.forEach((record) => {
      const name = record.messageKey.replace('notification_center.seed.', '');

      [notificationEn, notificationUk].forEach((catalog) => {
        expect(Reflect.get(catalog.notification_center.seed, name)).toEqual(expect.any(String));
      });
    });
  });
});
