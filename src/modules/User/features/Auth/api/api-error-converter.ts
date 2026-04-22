import { isHttpError } from '@/services/HttpsClient/HttpError';
import { injectable } from 'tsyringe';

import ApiErrorFactory from './api-error-factory';
import { ApiError } from './ApiErrors';

@injectable()
export default class ApiErrorConverter {
  public convert(error: unknown, context: string): ApiError {
    if (isHttpError(error)) return ApiErrorFactory.fromHttpError(error, context);
    if (error instanceof Error) return ApiErrorFactory.fromGenericError(error, context);
    return ApiErrorFactory.fromUnknownError(context);
  }
}
