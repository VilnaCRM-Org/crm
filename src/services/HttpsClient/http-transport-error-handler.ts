import { injectable } from 'tsyringe';

import { HttpError } from '@/services/HttpsClient/HttpError';
import ResponseMessages from '@/services/HttpsClient/responseMessages';

@injectable()
export default class HttpTransportErrorHandler {
  public throwAbortError(): never {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    throw abortError;
  }

  public rethrowOrWrap(error: unknown): never {
    const isAbortError =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: unknown }).name === 'AbortError';

    if (isAbortError) {
      throw error;
    }

    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError({ status: 0, message: ResponseMessages.NETWORK_ERROR, cause: error });
  }
}
