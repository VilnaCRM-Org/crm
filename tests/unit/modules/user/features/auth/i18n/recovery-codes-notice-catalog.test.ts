import en from '@auth/i18n/en.json';
import uk from '@auth/i18n/uk.json';

interface NoticeCatalog {
  readonly recovery_codes_notice: Record<string, string>;
}

const forms = (catalog: NoticeCatalog): string[] =>
  Object.keys(catalog.recovery_codes_notice)
    .filter((key) => key.startsWith('remaining_'))
    .sort();

describe('recovery codes notice catalog', () => {
  it('has the complete Ukrainian plural family: one, few, many and other', () => {
    expect(forms(uk)).toEqual([
      'remaining_few',
      'remaining_many',
      'remaining_one',
      'remaining_other',
    ]);
  });

  it('has the complete English plural family: one and other', () => {
    expect(forms(en)).toEqual(['remaining_one', 'remaining_other']);
  });

  it('puts the count placeholder in every plural form', () => {
    const catalogs: NoticeCatalog[] = [uk, en];
    for (const catalog of catalogs) {
      for (const key of forms(catalog)) {
        expect(catalog.recovery_codes_notice[key]).toContain('{{count}}');
      }
    }
  });

  it('names the none, link and dismiss texts in both languages', () => {
    const catalogs: NoticeCatalog[] = [uk, en];
    for (const catalog of catalogs) {
      for (const key of ['none', 'open_settings', 'dismiss']) {
        expect(catalog.recovery_codes_notice[key]).toEqual(expect.any(String));
        expect(catalog.recovery_codes_notice[key]).not.toBe('');
      }
    }
  });
});
