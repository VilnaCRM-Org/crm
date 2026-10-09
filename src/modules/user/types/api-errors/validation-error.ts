export interface ValidationErrorOptions {
  readonly message?: string;
  readonly status?: 400 | 422;
  readonly cause?: unknown;
}
