export const APP_CONFIG_ELEMENT_ID = 'app-runtime-config';

const ERROR_PREFIX = `The #${APP_CONFIG_ELEMENT_ID} runtime configuration block`;

class AppConfigSource {
  private cachedText: string | undefined;

  private cachedValues: Record<string, unknown> = {};

  public load(): Record<string, unknown> {
    return this.snapshot();
  }

  public snapshot(): Record<string, unknown> {
    const text = this.readText();

    if (text !== this.cachedText) {
      this.cachedValues = this.parse(text);
      this.cachedText = text;
    }

    return this.cachedValues;
  }

  public text(key: string): string | undefined {
    const value = this.snapshot()[key];

    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  public flags(): Record<string, unknown> {
    const value = this.snapshot().flags;

    return this.isRecord(value) ? value : {};
  }

  private readText(): string {
    const element =
      typeof document === 'undefined' ? null : document.getElementById(APP_CONFIG_ELEMENT_ID);

    return element?.textContent?.trim() ?? '';
  }

  private parse(text: string): Record<string, unknown> {
    const parsed = text ? this.parseJson(text) : {};

    if (!this.isRecord(parsed)) {
      throw new Error(`${ERROR_PREFIX} must contain a JSON object.`);
    }

    return parsed;
  }

  private parseJson(text: string): unknown {
    try {
      return JSON.parse(text) as unknown;
    } catch (cause) {
      throw new Error(`${ERROR_PREFIX} does not contain valid JSON: ${String(cause)}`);
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}

const appConfigSource = new AppConfigSource();

export default appConfigSource;
