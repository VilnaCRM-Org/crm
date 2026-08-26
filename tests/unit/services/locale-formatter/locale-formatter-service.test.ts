import localeFormatterCore from '@/services/locale-formatter/locale-formatter-core';
import LocaleFormatterService from '@/services/locale-formatter/locale-formatter-service';

jest.mock('@/services/locale-formatter/locale-formatter-core', () => ({
  __esModule: true,
  default: {
    date: jest.fn().mockReturnValue('date-result'),
    dateTime: jest.fn().mockReturnValue('date-time-result'),
    number: jest.fn().mockReturnValue('number-result'),
    currency: jest.fn().mockReturnValue('currency-result'),
    percent: jest.fn().mockReturnValue('percent-result'),
    relativeTime: jest.fn().mockReturnValue('relative-time-result'),
  },
}));

const core = jest.mocked(localeFormatterCore);
const JANUARY_15_2026_UTC = new Date(Date.UTC(2026, 0, 15));

describe('LocaleFormatterService', () => {
  const service = new LocaleFormatterService();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('delegates date to the core formatter', () => {
    expect(service.date(JANUARY_15_2026_UTC, 'uk')).toBe('date-result');
    expect(core.date).toHaveBeenCalledWith(JANUARY_15_2026_UTC, 'uk');
  });

  it('delegates dateTime to the core formatter', () => {
    expect(service.dateTime(JANUARY_15_2026_UTC, 'en')).toBe('date-time-result');
    expect(core.dateTime).toHaveBeenCalledWith(JANUARY_15_2026_UTC, 'en');
  });

  it('delegates number to the core formatter', () => {
    expect(service.number(1234.5, 'uk')).toBe('number-result');
    expect(core.number).toHaveBeenCalledWith(1234.5, 'uk');
  });

  it('delegates currency to the core formatter', () => {
    expect(service.currency(1234.5, 'USD', 'en')).toBe('currency-result');
    expect(core.currency).toHaveBeenCalledWith(1234.5, 'USD', 'en');
  });

  it('delegates percent to the core formatter', () => {
    expect(service.percent(0.5, 'en')).toBe('percent-result');
    expect(core.percent).toHaveBeenCalledWith(0.5, 'en');
  });

  it('delegates relativeTime to the core formatter', () => {
    expect(service.relativeTime(-2, 'day', 'uk')).toBe('relative-time-result');
    expect(core.relativeTime).toHaveBeenCalledWith(-2, 'day', 'uk');
  });
});
