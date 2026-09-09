export class IntlFormatterCache {
  private readonly dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();

  private readonly numberFormatters = new Map<string, Intl.NumberFormat>();

  private readonly relativeTimeFormatters = new Map<string, Intl.RelativeTimeFormat>();

  public dateTime(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    return this.remember(
      this.dateTimeFormatters,
      this.keyFor(locale, options),
      (): Intl.DateTimeFormat => new Intl.DateTimeFormat(locale, options)
    );
  }

  public number(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
    return this.remember(
      this.numberFormatters,
      this.keyFor(locale, options),
      (): Intl.NumberFormat => new Intl.NumberFormat(locale, options)
    );
  }

  public relativeTime(
    locale: string,
    options: Intl.RelativeTimeFormatOptions
  ): Intl.RelativeTimeFormat {
    return this.remember(
      this.relativeTimeFormatters,
      this.keyFor(locale, options),
      (): Intl.RelativeTimeFormat => new Intl.RelativeTimeFormat(locale, options)
    );
  }

  private keyFor(locale: string, options: object): string {
    return `${locale}:${JSON.stringify(options)}`;
  }

  private remember<T>(store: Map<string, T>, key: string, create: () => T): T {
    const cached = store.get(key);
    if (cached) {
      return cached;
    }
    const created = create();
    store.set(key, created);
    return created;
  }
}
