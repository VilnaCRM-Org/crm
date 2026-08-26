import { IntlFormatterCache } from '@/services/locale-formatter/intl-formatter-cache';

describe('IntlFormatterCache', () => {
  it('returns the same DateTimeFormat instance for a repeated locale and options pair', () => {
    const cache = new IntlFormatterCache();

    const first = cache.dateTime('uk', { dateStyle: 'medium' });

    expect(cache.dateTime('uk', { dateStyle: 'medium' })).toBe(first);
  });

  it('creates distinct DateTimeFormat instances per locale', () => {
    const cache = new IntlFormatterCache();

    const uk = cache.dateTime('uk', { dateStyle: 'medium' });
    const en = cache.dateTime('en', { dateStyle: 'medium' });

    expect(en).not.toBe(uk);
    expect(uk.resolvedOptions().locale).toBe('uk');
    expect(en.resolvedOptions().locale).toBe('en');
  });

  it('creates distinct DateTimeFormat instances per options', () => {
    const cache = new IntlFormatterCache();

    const medium = cache.dateTime('uk', { dateStyle: 'medium' });
    const short = cache.dateTime('uk', { dateStyle: 'short' });

    expect(short).not.toBe(medium);
    expect(short.resolvedOptions().dateStyle).toBe('short');
  });

  it('returns the same NumberFormat instance for a repeated locale and options pair', () => {
    const cache = new IntlFormatterCache();

    const first = cache.number('uk', { style: 'percent' });

    expect(cache.number('uk', { style: 'percent' })).toBe(first);
  });

  it('creates distinct NumberFormat instances per locale and per options', () => {
    const cache = new IntlFormatterCache();

    const ukDecimal = cache.number('uk', {});
    const enDecimal = cache.number('en', {});
    const ukPercent = cache.number('uk', { style: 'percent' });

    expect(enDecimal).not.toBe(ukDecimal);
    expect(ukPercent).not.toBe(ukDecimal);
    expect(ukDecimal.format(1234.5)).toBe('1\u00A0234,5');
    expect(enDecimal.format(1234.5)).toBe('1,234.5');
  });

  it('returns the same RelativeTimeFormat instance for a repeated locale and options pair', () => {
    const cache = new IntlFormatterCache();

    const first = cache.relativeTime('uk', { numeric: 'auto' });

    expect(cache.relativeTime('uk', { numeric: 'auto' })).toBe(first);
    expect(first.format(-1, 'day')).toBe('учора');
  });

  it('caches each formatter kind independently under the same locale and options key', () => {
    const cache = new IntlFormatterCache();

    const dateTime = cache.dateTime('uk', {});
    const numberFormat = cache.number('uk', {});

    expect(numberFormat.format(1234.5)).toBe('1\u00A0234,5');
    expect(dateTime.resolvedOptions().locale).toBe('uk');
  });
});
