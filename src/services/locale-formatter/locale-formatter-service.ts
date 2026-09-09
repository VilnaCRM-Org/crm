import { inject, injectable } from 'tsyringe';

import type { LocaleFormatter } from '@/services/types/locale-formatter/locale-formatter';

import type { LocaleFormatterCore } from './locale-formatter-core';
import LOCALE_FORMATTER_TOKENS from './tokens';

@injectable()
export default class LocaleFormatterService implements LocaleFormatter {
  constructor(
    @inject(LOCALE_FORMATTER_TOKENS.LocaleFormatterCore) private readonly core: LocaleFormatterCore
  ) {}

  public date(value: Date | number, locale?: string): string {
    return this.core.date(value, locale);
  }

  public dateTime(value: Date | number, locale?: string): string {
    return this.core.dateTime(value, locale);
  }

  public number(value: number, locale?: string): string {
    return this.core.number(value, locale);
  }

  public currency(value: number, currencyCode?: string, locale?: string): string {
    return this.core.currency(value, currencyCode, locale);
  }

  public percent(value: number, locale?: string): string {
    return this.core.percent(value, locale);
  }

  public relativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, locale?: string): string {
    return this.core.relativeTime(value, unit, locale);
  }
}
