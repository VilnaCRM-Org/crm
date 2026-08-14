import i18next from 'i18next';

import localeFormatterCore, {
  LocaleFormatterCore,
} from '@/services/locale-formatter/locale-formatter-core';

jest.mock('i18next', () => ({ __esModule: true, default: { language: undefined } }));

const i18nextStub = i18next as unknown as { language: string | undefined };
const JANUARY_15_2026_13_45_UTC = new Date(Date.UTC(2026, 0, 15, 13, 45));

describe('LocaleFormatterCore', () => {
  const ORIGINAL_ENV = { ...process.env };
  const formatter = new LocaleFormatterCore();

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    i18nextStub.language = undefined;
  });

  describe('date', () => {
    it('formats a medium date for the uk and en locales', () => {
      expect(formatter.date(JANUARY_15_2026_13_45_UTC, 'uk')).toBe('15 січ. 2026 р.');
      expect(formatter.date(JANUARY_15_2026_13_45_UTC, 'en')).toBe('Jan 15, 2026');
    });

    it('accepts a numeric timestamp', () => {
      expect(formatter.date(JANUARY_15_2026_13_45_UTC.getTime(), 'en')).toBe('Jan 15, 2026');
    });
  });

  describe('dateTime', () => {
    it('formats a medium date with short time for the uk and en locales', () => {
      expect(formatter.dateTime(JANUARY_15_2026_13_45_UTC, 'uk')).toBe('15 січ. 2026 р., 13:45');
      expect(formatter.dateTime(JANUARY_15_2026_13_45_UTC, 'en')).toBe('Jan 15, 2026, 1:45 PM');
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
    it('uses the active i18next language when no locale is given', () => {
      i18nextStub.language = 'en';

      expect(formatter.number(1234.5)).toBe('1,234.5');
    });

    it('falls back to the configured main language before i18next initializes', () => {
      process.env.REACT_APP_MAIN_LANGUAGE = 'en';

      expect(formatter.number(1234.5)).toBe('1,234.5');
    });

    it('defaults to uk when neither i18next nor the environment define a language', () => {
      delete process.env.REACT_APP_MAIN_LANGUAGE;

      expect(formatter.number(1234.5)).toBe('1\u00A0234,5');
    });
  });

  it('exports a shared singleton instance', () => {
    expect(localeFormatterCore).toBeInstanceOf(LocaleFormatterCore);
  });
});
