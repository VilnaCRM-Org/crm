import localeFormatterCore, {
  LocaleFormatterCore,
} from '@/services/locale-formatter/locale-formatter-core';

const JANUARY_15_2026_13_45 = new Date(2026, 0, 15, 13, 45);

describe('LocaleFormatterCore', () => {
  const ORIGINAL_ENV = { ...process.env };
  const formatter = new LocaleFormatterCore();

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe('date', () => {
    it('formats a medium date for the uk and en locales', () => {
      expect(formatter.date(JANUARY_15_2026_13_45, 'uk')).toBe('15 січ. 2026 р.');
      expect(formatter.date(JANUARY_15_2026_13_45, 'en')).toBe('Jan 15, 2026');
    });

    it('accepts a numeric timestamp', () => {
      expect(formatter.date(JANUARY_15_2026_13_45.getTime(), 'en')).toBe('Jan 15, 2026');
    });
  });

  describe('dateTime', () => {
    it('formats a medium date with short time for the uk and en locales', () => {
      const value = JANUARY_15_2026_13_45;
      expect(formatter.dateTime(value, 'uk')).toBe('15 січ. 2026 р., 13:45');
      expect(formatter.dateTime(value, 'en')).toBe('Jan 15, 2026, 1:45 PM');
    });
  });

  describe('number', () => {
    it('formats a decimal for the uk and en locales', () => {
      expect(formatter.number(1234.5, 'uk')).toBe('1\u00A0234,5');
      expect(formatter.number(1234.5, 'en')).toBe('1,234.5');
    });
  });

  describe('currency', () => {
    it('formats hryvnia by default for the uk and en locales', () => {
      expect(formatter.currency(1234.5, undefined, 'uk')).toBe('1\u00A0234,50\u00A0₴');
      expect(formatter.currency(1234.5, undefined, 'en')).toBe('₴1,234.50');
    });

    it('formats an explicit currency code for the uk and en locales', () => {
      expect(formatter.currency(1234.5, 'USD', 'uk')).toBe('1\u00A0234,50\u00A0$');
      expect(formatter.currency(1234.5, 'USD', 'en')).toBe('$1,234.50');
    });
  });

  describe('percent', () => {
    it('formats a ratio as a percentage for the uk and en locales', () => {
      expect(formatter.percent(0.1234, 'uk')).toBe('12,3%');
      expect(formatter.percent(0.1234, 'en')).toBe('12.3%');
    });
  });

  describe('relativeTime', () => {
    it('formats named relative days for the uk and en locales', () => {
      expect(formatter.relativeTime(-2, 'day', 'uk')).toBe('позавчора');
      expect(formatter.relativeTime(-2, 'day', 'en')).toBe('2 days ago');
    });

    it('formats numeric relative minutes for the uk and en locales', () => {
      expect(formatter.relativeTime(-5, 'minute', 'uk')).toBe('5 хвилин тому');
      expect(formatter.relativeTime(-5, 'minute', 'en')).toBe('5 minutes ago');
    });
  });

  describe('locale resolution', () => {
    it('uses the bound language source when no locale is given', () => {
      const bound = new LocaleFormatterCore();
      bound.bindLanguageSource({ language: 'en' });

      expect(bound.number(1234.5)).toBe('1,234.5');
    });

    it('falls back to the configured main language while no language source is bound', () => {
      process.env.REACT_APP_MAIN_LANGUAGE = 'en';

      expect(formatter.number(1234.5)).toBe('1,234.5');
    });

    it('falls back to the configured main language while the bound language is undefined', () => {
      const bound = new LocaleFormatterCore();
      bound.bindLanguageSource({});
      process.env.REACT_APP_MAIN_LANGUAGE = 'en';

      expect(bound.number(1234.5)).toBe('1,234.5');
    });

    it('defaults to uk when no language source defines a language', () => {
      delete process.env.REACT_APP_MAIN_LANGUAGE;

      expect(formatter.number(1234.5)).toBe('1\u00A0234,5');
    });
  });

  it('exports a shared singleton instance', () => {
    expect(localeFormatterCore).toBeInstanceOf(LocaleFormatterCore);
  });
});
