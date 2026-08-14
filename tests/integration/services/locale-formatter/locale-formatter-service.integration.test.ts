import 'reflect-metadata';

import container from '@/config/dependency-injection-config';
import LOCALE_FORMATTER_TOKENS from '@/services/locale-formatter/tokens';
import type { LocaleFormatter } from '@/services/types/locale-formatter/locale-formatter';

const JANUARY_15_2026_13_45 = new Date(2026, 0, 15, 13, 45);

describe('locale formatter service (integration)', () => {
  const ORIGINAL_ENV = { ...process.env };
  const service = container.resolve<LocaleFormatter>(
    LOCALE_FORMATTER_TOKENS.LocaleFormatterService
  );

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('resolves a singleton through the aggregated DI container', () => {
    expect(container.resolve(LOCALE_FORMATTER_TOKENS.LocaleFormatterService)).toBe(service);
  });

  it('resolves the locale from the environment first, then the bound i18n language', async () => {
    delete process.env.REACT_APP_MAIN_LANGUAGE;
    expect(service.currency(1234.5)).toBe('1\u00A0234,50\u00A0₴');

    process.env.REACT_APP_MAIN_LANGUAGE = 'en';
    expect(service.number(1234.5)).toBe('1,234.5');

    const { default: i18n } = await import('@/i18n');
    await i18n.changeLanguage('en');
    delete process.env.REACT_APP_MAIN_LANGUAGE;
    expect(service.currency(1234.5)).toBe('₴1,234.50');
  });

  it('honors an explicit locale override across every formatter', () => {
    expect(service.date(JANUARY_15_2026_13_45, 'uk')).toBe('15 січ. 2026 р.');
    expect(service.dateTime(JANUARY_15_2026_13_45, 'uk')).toBe('15 січ. 2026 р., 13:45');
    expect(service.number(1234.5, 'uk')).toBe('1\u00A0234,5');
    expect(service.currency(1234.5, 'USD', 'uk')).toBe('1\u00A0234,50\u00A0$');
    expect(service.percent(0.1234, 'uk')).toBe('12,3%');
    expect(service.relativeTime(-2, 'day', 'uk')).toBe('позавчора');
  });

  it('serves repeated calls from the cached formatter instances', () => {
    expect(service.percent(0.1234, 'en')).toBe('12.3%');
    expect(service.percent(0.5, 'en')).toBe('50%');
  });
});
