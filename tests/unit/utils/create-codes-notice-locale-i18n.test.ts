import createCodesNoticeLocaleI18n from './create-codes-notice-locale-i18n';
import createLocaleI18n from './create-locale-i18n';

describe('createCodesNoticeLocaleI18n', () => {
  it('resolves the low-codes notice copy with Ukrainian plurals', () => {
    const { t } = createCodesNoticeLocaleI18n('uk');

    expect(t('recovery_codes_notice.remaining', { count: 1 })).toBe(
      'Залишився 1 резервний код. Створіть нові коди в налаштуваннях.'
    );
    expect(t('recovery_codes_notice.remaining', { count: 3 })).toBe(
      'Залишилося 3 резервні коди. Створіть нові коди в налаштуваннях.'
    );
    expect(t('recovery_codes_notice.none')).toBe(
      'Резервні коди закінчилися. Створіть нові коди зараз.'
    );
    expect(t('recovery_codes_notice.dismiss')).toBe('Закрити сповіщення');
  });

  it('resolves the low-codes notice copy in en', () => {
    const { t } = createCodesNoticeLocaleI18n('en');

    expect(t('recovery_codes_notice.remaining', { count: 2 })).toBe(
      '2 recovery codes left. Generate new codes in settings.'
    );
    expect(t('recovery_codes_notice.open_settings')).toBe('Open settings');
  });

  it('keeps the merged catalog, so an eager key resolves beside the notice copy', () => {
    const { t } = createCodesNoticeLocaleI18n('en');

    expect(t('error_boundary.title')).toBe('Something went wrong');
  });

  it('leaves a notice key raw without the helper, because the catalog is lazy', () => {
    const { t } = createLocaleI18n('uk');

    expect(t('recovery_codes_notice.none')).toBe('recovery_codes_notice.none');
  });
});
