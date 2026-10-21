import type { i18n as I18nInstance } from 'i18next';

import policyEn from '@/components/ui-password-policy-rules/i18n/en.json';
import policyUk from '@/components/ui-password-policy-rules/i18n/uk.json';
import toastEn from '@/components/ui-toast/i18n/en.json';
import toastUk from '@/components/ui-toast/i18n/uk.json';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';
import type { LocaleCatalogPair } from '@/lib/locale-catalog/types/locale-catalog-pair';
import settingsEn from '@/modules/user/features/settings/i18n/en.json';
import settingsUk from '@/modules/user/features/settings/i18n/uk.json';
import recoveryEn from '@auth/routes/recovery-catalog/i18n/en.json';
import recoveryUk from '@auth/routes/recovery-catalog/i18n/uk.json';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';

const createInstance = (seeded: Record<string, unknown> = {}): I18nInstance =>
  createLocaleI18n('uk', ['en'], seeded);

const CATALOGS: ReadonlyArray<[string, LocaleCatalogPair, string, string, string]> = [
  [
    'password recovery',
    { en: recoveryEn, uk: recoveryUk },
    'password_recovery.title',
    'Forgot your password?',
    'Забули пароль?',
  ],
  [
    'password policy',
    { en: policyEn, uk: policyUk },
    'password_policy.rules.digit',
    'At least one digit',
    'Принаймні одна цифра',
  ],
  ['settings', { en: settingsEn, uk: settingsUk }, 'settings.heading', 'Settings', 'Налаштування'],
  [
    'toast',
    { en: toastEn, uk: toastUk },
    'ui_toast.close',
    'Close notification',
    'Закрити сповіщення',
  ],
];

describe('LazyCatalogLoader', () => {
  it.each(CATALOGS)(
    'registers the %s copy for both locales in the translation namespace',
    (_name, catalog, key, english, ukrainian) => {
      const instance = createInstance();

      lazyCatalogLoader.register(instance, catalog);

      expect(instance.getResourceBundle('en', 'translation')).toEqual(catalog.en);
      expect(instance.getResourceBundle('uk', 'translation')).toEqual(catalog.uk);
      expect(instance.t(key)).toBe(ukrainian);
      expect(instance.t(key, { lng: 'en' })).toBe(english);
    }
  );

  it.each([
    ['en', 'Back'],
    ['uk', 'Назад'],
  ])('merges the %s copy into an existing namespace instead of replacing it', (locale, back) => {
    const instance = createInstance({
      sign_in: { title: 'Authentication' },
      password_recovery: { seeded: 'kept' },
    });

    lazyCatalogLoader.register(instance, { en: recoveryEn, uk: recoveryUk });

    expect(instance.getResource(locale, 'translation', 'sign_in.title')).toBe('Authentication');
    expect(instance.getResource(locale, 'translation', 'password_recovery.seeded')).toBe('kept');
    expect(instance.getResource(locale, 'translation', 'password_recovery.back')).toBe(back);
  });

  it('ships the settings shell, profile, social and toast groups in both locales', () => {
    const groups = ['errors', 'heading', 'profile', 'social', 'subtitle', 'title', 'toasts'];

    expect(Object.keys(settingsEn.settings).sort()).toEqual(groups);
    expect(Object.keys(settingsUk.settings).sort()).toEqual(groups);
    expect(settingsEn.settings.profile.greeting).toBe('Welcome!');
    expect(settingsUk.settings.profile.greeting).toBe('Вітаємо!');
    expect(settingsUk.settings.social.heading).toBe('Соціальні мережі');
  });
});
