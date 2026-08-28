import { injectable } from 'tsyringe';

import type { LocaleFormatter } from '@/services/types/locale-formatter/locale-formatter';

import localeFormatterCore from './locale-formatter-core';

@injectable()
export default class LocaleFormatterService implements LocaleFormatter {
  public date(value: Date | number, locale?: string): string {
    return localeFormatterCore.date(value, locale);
  }

  public dateTime(value: Date | number, locale?: string): string {
    return localeFormatterCore.dateTime(value, locale);
  }

  public number(value: number, locale?: string): string {
    return localeFormatterCore.number(value, locale);
  }

  public currency(value: number, currencyCode?: string, locale?: string): string {
    return localeFormatterCore.currency(value, currencyCode, locale);
  }

  public percent(value: number, locale?: string): string {
    return localeFormatterCore.percent(value, locale);
  }

  public relativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, locale?: string): string {
    return localeFormatterCore.relativeTime(value, unit, locale);
  }
}
