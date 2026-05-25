export type ApiErrorOptions = Readonly<{
  message: string;
  code: string;
  status?: number;
  cause?: unknown;
}>;

export default class ApiError extends Error {
  public readonly code: string;

  public readonly status?: number;

  public readonly cause?: unknown;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.name = 'ApiError';
    this.code = options.code;
    this.status = options.status;
    this.cause = options.cause;

    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }
}
