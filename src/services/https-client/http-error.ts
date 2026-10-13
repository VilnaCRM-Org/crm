import type { HttpErrorJson, HttpErrorParams } from '@/services/types/https-client/http-error';

export class HttpError extends Error {
  public readonly status: number;

  public override readonly cause?: unknown;

  constructor({ status, message, cause }: HttpErrorParams) {
    super(message);
    this.status = status;
    this.cause = cause;
    this.name = 'HttpError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }

  public toJSON(): HttpErrorJson {
    return { name: this.name, message: this.message, status: this.status, cause: this.cause };
  }
}
