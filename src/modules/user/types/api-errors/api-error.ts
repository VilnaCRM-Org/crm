export interface ApiErrorOptions {
  readonly message: string;
  readonly code: string;
  readonly status?: number;
  readonly cause?: unknown;
}
