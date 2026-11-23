import type { AppConfigParse, AppConfigUrlKey, AppConfigValues } from './types/app-config';
import type { FeatureFlag } from './types/feature-flag';

export const APP_CONFIG_ELEMENT_ID = 'app-runtime-config';

const ERROR_PREFIX = `The #${APP_CONFIG_ELEMENT_ID} runtime configuration block`;

class AppConfigSource {
  private cachedText: string | undefined;

  private cachedValues: Record<string, unknown> = {};

  public load(): void {
    this.raw();
  }

  public validated(parse: AppConfigParse): AppConfigValues {
    return parse(this.raw());
  }

  public text(key: AppConfigUrlKey): string | undefined {
    const value = this.raw()[key];

    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  // Dependency-free counterpart of the `z.httpUrl()` contract in app-config-schema.ts. The paint
  // path reads endpoints before the zod layer exists, so a value that is not an absolute http(s)
  // URL is reported as absent and the caller falls back to its build-time default, rather than
  // being handed to fetch as-is.
  public url(key: AppConfigUrlKey): string | undefined {
    const value = this.text(key);

    return value !== undefined && this.isHttpUrl(value) ? value : undefined;
  }

  public flag(name: FeatureFlag): boolean | undefined {
    const flags = this.raw().flags;
    const value = this.isRecord(flags) ? flags[name] : undefined;

    return typeof value === 'boolean' ? value : undefined;
  }

  private raw(): Record<string, unknown> {
    const element =
      typeof document === 'undefined' ? null : document.getElementById(APP_CONFIG_ELEMENT_ID);
    const text = element?.textContent?.trim() ?? '';

    if (text !== this.cachedText) {
      this.cachedValues = this.parse(text);
      this.cachedText = text;
    }

    return this.cachedValues;
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

  private isHttpUrl(value: string): boolean {
    try {
      const { protocol } = new URL(value);

      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  }
}

const appConfigSource = new AppConfigSource();

export default appConfigSource;
