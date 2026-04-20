import { isHttpError } from '@/services/HttpsClient/HttpError';

import { fromGenericError, fromHttpError, fromUnknownError } from './api-error-factory';
import { ApiError } from './ApiErrors';

export default class BaseAPI {
  protected handleApiError(error: unknown, context: string): ApiError {
    if (isHttpError(error)) return fromHttpError(error, context);
    if (error instanceof Error) return fromGenericError(error, context);
    return fromUnknownError(context);
  }
}
