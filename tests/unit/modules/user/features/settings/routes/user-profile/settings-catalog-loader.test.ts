import type { i18n as I18nInstance } from 'i18next';

import en from '@/modules/user/features/settings/i18n/en.json';
import uk from '@/modules/user/features/settings/i18n/uk.json';
import settings from '@/modules/user/features/settings/routes/user-profile/settings-catalog-loader';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';

const createInstance = (seeded: Record<string, unknown> = {}): I18nInstance =>
  createLocaleI18n('uk', ['en'], seeded);

describe('SettingsCatalogLoader', () => {
  it('registers the settings copy for both locales in the translation namespace', () => {
    const instance = createInstance();

    settings.register(instance);

    expect(instance.getResourceBundle('en', 'translation')).toEqual(en);
    expect(instance.getResourceBundle('uk', 'translation')).toEqual(uk);
    expect(instance.t('settings.heading')).toBe('Налаштування');
    expect(instance.t('settings.heading', { lng: 'en' })).toBe('Settings');
  });

  it.each([
    ['en', 'Settings'],
    ['uk', 'Налаштування'],
  ])('merges the %s copy into an existing namespace instead of replacing it', (locale, title) => {
    const instance = createInstance({ sign_in: { title: 'Authentication' }, settings: { x: 'y' } });

    settings.register(instance);

    expect(instance.getResource(locale, 'translation', 'sign_in.title')).toBe('Authentication');
    expect(instance.getResource(locale, 'translation', 'settings.x')).toBe('y');
    expect(instance.getResource(locale, 'translation', 'settings.title')).toBe(title);
  });

  it('ships the shell, profile and toast groups in both locales', () => {
    expect(Object.keys(en.settings).sort()).toEqual([
      'heading',
      'profile',
      'subtitle',
      'title',
      'toasts',
    ]);
    expect(Object.keys(uk.settings).sort()).toEqual([
      'heading',
      'profile',
      'subtitle',
      'title',
      'toasts',
    ]);
    expect(en.settings.profile.greeting).toBe('Welcome!');
    expect(uk.settings.profile.greeting).toBe('Вітаємо!');
  });
});
