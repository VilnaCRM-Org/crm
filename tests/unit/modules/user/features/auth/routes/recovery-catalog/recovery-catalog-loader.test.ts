import type { i18n as I18nInstance } from 'i18next';

import en from '@auth/routes/recovery-catalog/i18n/en.json';
import uk from '@auth/routes/recovery-catalog/i18n/uk.json';
import recoveryCatalogLoader from '@auth/routes/recovery-catalog/recovery-catalog-loader';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';

const createInstance = (seeded: Record<string, unknown> = {}): I18nInstance =>
  createLocaleI18n('uk', ['en'], seeded);

describe('RecoveryCatalogLoader', () => {
  it('registers the recovery copy for both locales in the translation namespace', () => {
    const instance = createInstance();

    recoveryCatalogLoader.register(instance);

    expect(instance.getResourceBundle('en', 'translation')).toEqual(en);
    expect(instance.getResourceBundle('uk', 'translation')).toEqual(uk);
    expect(instance.t('password_recovery.title')).toBe('Забули пароль?');
    expect(instance.t('password_recovery.title', { lng: 'en' })).toBe('Forgot your password?');
  });

  it.each([
    ['en', 'Back'],
    ['uk', 'Назад'],
  ])('merges the %s copy into an existing namespace instead of replacing it', (locale, back) => {
    const instance = createInstance({
      sign_in: { title: 'Authentication' },
      password_recovery: { seeded: 'kept' },
    });

    recoveryCatalogLoader.register(instance);

    expect(instance.getResource(locale, 'translation', 'sign_in.title')).toBe('Authentication');
    expect(instance.getResource(locale, 'translation', 'password_recovery.seeded')).toBe('kept');
    expect(instance.getResource(locale, 'translation', 'password_recovery.back')).toBe(back);
  });
});
