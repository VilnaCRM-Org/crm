import createComingSoonLocaleI18n from './create-coming-soon-locale-i18n';
import createLocaleI18n from './create-locale-i18n';

describe('createComingSoonLocaleI18n', () => {
  it('resolves the coming-soon copy in uk', () => {
    const { t } = createComingSoonLocaleI18n('uk');

    expect(t('coming_soon.message')).toBe(
      'Цей розділ ще в розробці. Ми повідомимо, щойно він запрацює.'
    );
    expect(t('coming_soon.home_link')).toBe('На головну сторінку');
    expect(t('coming_soon.sections.boards')).toBe('Дошки');
    expect(t('coming_soon.sections.billing')).toBe('Білінг');
  });

  it('resolves the coming-soon copy in en', () => {
    const { t } = createComingSoonLocaleI18n('en');

    expect(t('coming_soon.message')).toBe(
      'This section is coming soon. We will let you know when it is ready.'
    );
    expect(t('coming_soon.home_link')).toBe('Back to the home page');
    expect(t('coming_soon.sections.boards')).toBe('Boards');
    expect(t('coming_soon.sections.billing')).toBe('Billing');
  });

  it('keeps the merged catalogs, so an eager key resolves beside the coming-soon copy', () => {
    const { t } = createComingSoonLocaleI18n('en');

    expect(t('error_boundary.title')).toBe('Something went wrong');
  });

  it('leaves a coming-soon key raw without the helper, because the catalog is lazy', () => {
    const { t } = createLocaleI18n('uk');

    expect(t('coming_soon.sections.boards')).toBe('coming_soon.sections.boards');
  });
});
