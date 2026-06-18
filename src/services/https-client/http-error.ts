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

  public toJSON(): { name: string; message: string; status: number; cause?: unknown } {
    return { name: this.name, message: this.message, status: this.status, cause: this.cause };
  }
}
