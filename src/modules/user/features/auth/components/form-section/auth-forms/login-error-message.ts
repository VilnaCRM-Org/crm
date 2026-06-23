import type { Extractor, SerializedError } from '@auth/types/auth-forms/login-error-message';

const UNKNOWN_KEY = 'auth.errors.unknown';

export default class LoginErrorMessageNormalizer {
  private readonly extractors: Extractor[];

  constructor() {
    this.extractors = [
      this.directStringExtractor.bind(this),
      this.errorInstanceExtractor.bind(this),
      this.serializedExtractor.bind(this),
      this.nestedFieldsExtractor.bind(this),
    ];
  }

  public normalize(error: unknown): string {
    for (const extract of this.extractors) {
      const result = extract(error);
      if (result) return result;
    }
    return UNKNOWN_KEY;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private trimmedString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private getNestedMessage(value: unknown): string | null {
    const direct = this.trimmedString(value);
    if (direct) return direct;
    return this.isRecord(value) ? this.trimmedString(value.message) : null;
  }

  private directStringExtractor(error: unknown): string | null {
    return this.trimmedString(error);
  }

  private errorInstanceExtractor(error: unknown): string | null {
    return error instanceof Error ? this.trimmedString(error.message) : null;
  }

  private serializedExtractor(error: unknown): string | null {
    return this.isRecord(error) ? this.trimmedString((error as SerializedError).message) : null;
  }

  private nestedFieldsExtractor(error: unknown): string | null {
    if (!this.isRecord(error)) return null;
    const candidates = [error.message, error.displayMessage, error.data];
    for (const candidate of candidates) {
      const message = this.getNestedMessage(candidate);
      if (message) return message;
    }
    return null;
  }
}
