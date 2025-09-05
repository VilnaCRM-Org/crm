export interface HttpErrorParams {
  status: number;
  message: string;
  cause?: unknown;
}

export class HttpError extends Error {
  public readonly status: number;

  public readonly cause?: unknown;

  constructor({ status, message, cause }: HttpErrorParams) {
    super(message);
    this.status = status;
    this.cause = cause;
    this.name = 'HttpError';

    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }
}

export const isHttpError = (e: unknown): e is HttpError => {
  if (e instanceof HttpError) return true;

  if (typeof e === 'object' && e !== null) {
    const maybeHttpError = e as Record<string, unknown>;
    return maybeHttpError.name === 'HttpError' && typeof maybeHttpError.status === 'number';
  }

  return false;
};
