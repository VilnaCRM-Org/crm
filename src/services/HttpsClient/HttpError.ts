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
  }
}
