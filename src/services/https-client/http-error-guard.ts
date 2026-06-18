import { injectable } from 'tsyringe';

import { HttpError } from '@/services/https-client/http-error';

@injectable()
export default class HttpErrorGuard {
  public is(error: unknown): error is HttpError {
    if (error instanceof HttpError) return true;

    if (typeof error === 'object' && error !== null) {
      const maybeHttpError = error as Record<string, unknown>;
      return maybeHttpError.name === 'HttpError' && typeof maybeHttpError.status === 'number';
    }

    return false;
  }
}
