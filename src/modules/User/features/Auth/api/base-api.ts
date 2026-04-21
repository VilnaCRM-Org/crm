import { isHttpError } from '@/services/HttpsClient/HttpError';

import ApiErrorFactory from './api-error-factory';
import { ApiError } from './ApiErrors';

export default class BaseAPI {
  protected handleApiError(error: unknown, context: string): ApiError {
    if (isHttpError(error)) return ApiErrorFactory.fromHttpError(error, context);
    if (error instanceof Error) return ApiErrorFactory.fromGenericError(error, context);
    return ApiErrorFactory.fromUnknownError(context);
  }
}
