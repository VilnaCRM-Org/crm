export type ValidationErrorOptions = Readonly<{
  message?: string;
  status?: 400 | 422;
  cause?: unknown;
}>;
