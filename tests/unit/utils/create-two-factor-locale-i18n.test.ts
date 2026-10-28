import createLocaleI18n from './create-locale-i18n';
import createTwoFactorLocaleI18n from './create-two-factor-locale-i18n';

describe('createTwoFactorLocaleI18n', () => {
  it('resolves the two-factor challenge copy in uk', () => {
    const { t } = createTwoFactorLocaleI18n('uk');

    expect(t('two_factor.title')).toBe('Двофакторна автентифікація');
    expect(t('two_factor.submit_button')).toBe('Підтвердити');
    expect(t('two_factor.recovery.label')).toBe('Резервний код');
    expect(t('two_factor.banner.rate_limited')).toBe(
      'Забагато спроб. Зачекайте хвилину і спробуйте знову.'
    );
  });

  it('resolves the two-factor challenge copy in en', () => {
    const { t } = createTwoFactorLocaleI18n('en');

    expect(t('two_factor.title')).toBe('Two-factor authentication');
    expect(t('two_factor.submit_button')).toBe('Confirm');
    expect(t('two_factor.recovery.label')).toBe('Recovery code');
    expect(t('two_factor.banner.rate_limited')).toBe(
      'Too many attempts. Wait a minute and try again.'
    );
  });

  it('registers the recovery copy the challenge card back control renders', () => {
    const { t } = createTwoFactorLocaleI18n('uk');

    expect(t('password_recovery.back')).toBe('Назад');
  });

  it('keeps the merged catalog, so the eager sign-in notice resolves beside it', () => {
    const { t } = createTwoFactorLocaleI18n('en');

    expect(t('sign_in.notices.two_factor_expired')).toBe(
      'The time to confirm your sign-in has run out. Please sign in again.'
    );
  });

  it('leaves a challenge key raw without the helper, because the catalog is lazy', () => {
    const { t } = createLocaleI18n('uk');

    expect(t('two_factor.title')).toBe('two_factor.title');
  });
});
