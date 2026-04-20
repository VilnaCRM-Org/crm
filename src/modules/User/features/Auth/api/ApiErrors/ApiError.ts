export default class ApiError extends Error {
  public readonly code: string;

  public readonly status?: number;

  public readonly cause?: unknown;

  constructor(message: string, code: string, ...rest: [status?: number, cause?: unknown]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    [this.status, this.cause] = rest;

    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }
}
