import type { i18n as I18nInstance } from 'i18next';

import en from '@/components/ui-password-policy-rules/i18n/en.json';
import uk from '@/components/ui-password-policy-rules/i18n/uk.json';
import policyLoader from '@/components/ui-password-policy-rules/password-policy-catalog-loader';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';

const createInstance = (seeded: Record<string, unknown> = {}): I18nInstance =>
  createLocaleI18n('uk', ['en'], seeded);

describe('PasswordPolicyCatalogLoader', () => {
  it('registers the policy copy for both locales in the translation namespace', () => {
    const instance = createInstance();

    policyLoader.register(instance);

    expect(instance.getResourceBundle('en', 'translation')).toEqual(en);
    expect(instance.getResourceBundle('uk', 'translation')).toEqual(uk);
    expect(instance.t('password_policy.rules.digit')).toBe('Принаймні одна цифра');
    expect(instance.t('password_policy.rules.digit', { lng: 'en' })).toBe('At least one digit');
  });

  it.each([
    ['en', 'met'],
    ['uk', 'виконано'],
  ])('merges the %s copy into an existing namespace instead of replacing it', (locale, met) => {
    const instance = createInstance({
      sign_in: { title: 'Authentication' },
      password_policy: { seeded: 'kept' },
    });

    policyLoader.register(instance);

    expect(instance.getResource(locale, 'translation', 'sign_in.title')).toBe('Authentication');
    expect(instance.getResource(locale, 'translation', 'password_policy.seeded')).toBe('kept');
    expect(instance.getResource(locale, 'translation', 'password_policy.state.met')).toBe(met);
  });
});
