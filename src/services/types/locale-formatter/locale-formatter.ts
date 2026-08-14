export interface LocaleFormatter {
  date(value: Date | number, locale?: string): string;
  dateTime(value: Date | number, locale?: string): string;
  number(value: number, locale?: string): string;
  currency(value: number, currencyCode?: string, locale?: string): string;
  percent(value: number, locale?: string): string;
  relativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, locale?: string): string;
}
