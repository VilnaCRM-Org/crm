import rawEnv from '@/config/env/raw-env';
import type {
  LanguageSource,
  LocaleFormatter,
} from '@/services/types/locale-formatter/locale-formatter';

import { IntlFormatterCache } from './intl-formatter-cache';

export class LocaleFormatterCore implements LocaleFormatter {
  private readonly cache = new IntlFormatterCache();

  private readonly dateOptions: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };

  private readonly dateTimeOptions: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
  };

  private readonly decimalOptions: Intl.NumberFormatOptions = {};

  private readonly percentOptions: Intl.NumberFormatOptions = {
    style: 'percent',
    maximumFractionDigits: 1,
  };

  private readonly relativeTimeOptions: Intl.RelativeTimeFormatOptions = { numeric: 'auto' };

  private languageSource: LanguageSource | null = null;

  public bindLanguageSource(source: LanguageSource): void {
    this.languageSource = source;
  }

  public date(value: Date | number, locale?: string): string {
    return this.cache.dateTime(this.resolveLocale(locale), this.dateOptions).format(value);
  }

  public dateTime(value: Date | number, locale?: string): string {
    return this.cache.dateTime(this.resolveLocale(locale), this.dateTimeOptions).format(value);
  }

  public number(value: number, locale?: string): string {
    return this.cache.number(this.resolveLocale(locale), this.decimalOptions).format(value);
  }

  public currency(value: number, currencyCode = 'UAH', locale?: string): string {
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
    };
    return this.cache.number(this.resolveLocale(locale), options).format(value);
  }

  public percent(value: number, locale?: string): string {
    return this.cache.number(this.resolveLocale(locale), this.percentOptions).format(value);
  }

  public relativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, locale?: string): string {
    return this.cache
      .relativeTime(this.resolveLocale(locale), this.relativeTimeOptions)
      .format(value, unit);
  }

  private resolveLocale(locale?: string): string {
    return locale ?? this.languageSource?.language ?? rawEnv.mainLanguage();
  }
}

const localeFormatterCore = new LocaleFormatterCore();

export default localeFormatterCore;
