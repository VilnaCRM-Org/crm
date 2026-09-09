import { LocaleFormatterCore } from '@/services/locale-formatter/locale-formatter-core';
import LocaleFormatterService from '@/services/locale-formatter/locale-formatter-service';

const createCore = (): LocaleFormatterCore => {
  const core = new LocaleFormatterCore();
  jest.spyOn(core, 'date').mockReturnValue('date-result');
  jest.spyOn(core, 'dateTime').mockReturnValue('date-time-result');
  jest.spyOn(core, 'number').mockReturnValue('number-result');
  jest.spyOn(core, 'currency').mockReturnValue('currency-result');
  jest.spyOn(core, 'percent').mockReturnValue('percent-result');
  jest.spyOn(core, 'relativeTime').mockReturnValue('relative-time-result');
  return core;
};

const JANUARY_15_2026_UTC = new Date(Date.UTC(2026, 0, 15));

describe('LocaleFormatterService', () => {
  const core = createCore();
  const service = new LocaleFormatterService(core);

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
