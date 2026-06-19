export type ApiErrorOptions = Readonly<{
  message: string;
  code: string;
  status?: number;
  cause?: unknown;
}>;
