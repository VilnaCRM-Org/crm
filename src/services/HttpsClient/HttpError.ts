export interface HttpErrorParams {
  status: number;
  message: string;
}

export default class HttpError extends Error {
  public readonly status: number;

  constructor({ status, message }: HttpErrorParams) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }
}
