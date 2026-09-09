import type { i18n as I18nType } from 'i18next';

import i18nMod from '@/i18n';

const i18n = i18nMod as unknown as I18nType;
const JANUARY_15_2026_13_45 = new Date(2026, 0, 15, 13, 45);

describe('i18n formatters (issue #155)', () => {
  beforeAll(async () => {
    if (!i18n.isInitialized) {
      await new Promise((resolve) => {
        i18n.on('initialized', resolve);
      });
    }
    i18n.addResource('en', 'translation', 'probe_date', '{{value, date}}');
    i18n.addResource('en', 'translation', 'probe_number', '{{value, number}}');
    i18n.addResource('uk', 'translation', 'probe_percent', '{{value, percent}}');
    i18n.addResource('uk', 'translation', 'probe_relative', '{{value, relativetime(range: day)}}');
  });

  it('renders {{value, datetime}} translation strings with the uk locale', () => {
    expect(i18n.t('formatting.updated_at', { value: JANUARY_15_2026_13_45, lng: 'uk' })).toBe(
      'Оновлено 15 січ. 2026 р., 13:45'
    );
  });

  it('renders {{value, datetime}} translation strings with the en locale', () => {
    expect(i18n.t('formatting.updated_at', { value: JANUARY_15_2026_13_45, lng: 'en' })).toBe(
      'Last updated Jan 15, 2026, 1:45 PM'
    );
  });

  it('renders {{value, currency}} translation strings with the uk locale', () => {
    expect(i18n.t('formatting.price', { value: 1234.5, lng: 'uk' })).toBe(
      'Ціна: 1\u00A0234,50\u00A0₴'
    );
  });

  it('renders {{value, currency}} translation strings with the en locale', () => {
    expect(i18n.t('formatting.price', { value: 1234.5, lng: 'en' })).toBe('Price: ₴1,234.50');
  });

  it('renders the date, number, percent, and relativetime formatters through t()', () => {
    expect(i18n.t('probe_date', { value: JANUARY_15_2026_13_45, lng: 'en' })).toBe('Jan 15, 2026');
    expect(i18n.t('probe_number', { value: 1234.5, lng: 'en' })).toBe('1,234.5');
    expect(i18n.t('probe_percent', { value: 0.1234, lng: 'uk' })).toBe('12,3%');
    expect(i18n.t('probe_relative', { value: -2, lng: 'uk' })).toBe('позавчора');
  });
});
