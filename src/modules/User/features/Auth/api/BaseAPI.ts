import { isHttpError } from '@/services/HttpsClient/HttpError';

import {
  ApiError,
  ValidationError,
  AuthenticationError,
  ConflictError,
  ApiErrorCodes,
} from './ApiErrors';

export default class BaseAPI {
  protected handleApiError(error: unknown, context: string): ApiError {
    if (isHttpError(error)) {
      switch (error.status) {
        case 400:
          return new ValidationError({
            message: `Invalid ${context.toLowerCase()} data`,
            status: 400,
          });
        case 401:
          return new AuthenticationError();
        case 403:
          return new ApiError('Forbidden', ApiErrorCodes.FORBIDDEN, 403, error);
        case 404:
          return new ApiError(`${context} not found`, ApiErrorCodes.NOT_FOUND, 404, error);
        case 408:
          return new ApiError(
            'Request timed out. Please try again.',
            ApiErrorCodes.TIMEOUT,
            408,
            error
          );
        case 422:
          return new ValidationError({
            message: `Unprocessable ${context.toLowerCase()} data`,
            status: 422,
          });
        case 429:
          return new ApiError(
            'Too many requests. Please slow down.',
            ApiErrorCodes.RATE_LIMITED,
            429,
            error
          );
        case 409:
          return new ConflictError(`${context} conflict. Resource already exists.`);
        case 502:
        case 503:
        case 504:
          return new ApiError(
            'Service unavailable. Please try again later.',
            ApiErrorCodes.SERVER,
            error.status,
            error
          );
        case 500:
          return new ApiError(
            'Server error. Please try again later.',
            ApiErrorCodes.SERVER,
            500,
            error
          );
        default:
          return new ApiError(`${context} failed`, ApiErrorCodes.UNKNOWN, error.status, error);
      }
    }

    if (error instanceof Error && this.isAbortError(error)) {
      return new ApiError('Request canceled.', ApiErrorCodes.CANCELLED, undefined, error);
    }
    if (error instanceof Error && this.isNetworkError(error.message)) {
      return new ApiError(
        'Network error. Please check your connection.',
        ApiErrorCodes.NETWORK,
        undefined,
        error
      );
    }

    return new ApiError(`${context} failed. Please try again.`, ApiErrorCodes.UNKNOWN);
  }

  private isAbortError(err: Error): boolean {
    const name = err.name?.toLowerCase?.() ?? '';
    const msg = err.message?.toLowerCase?.() ?? '';
    return name === 'aborterror' || msg.includes('abort');
  }

  private isNetworkError(message: string): boolean {
    const m = message.toLowerCase();
    return (
      m.includes('failed to fetch') ||
      m.includes('network') ||
      m.includes('connection') ||
      m.includes('timeout') ||
      m.includes('cors') ||
      m.includes('econnreset') ||
      m.includes('enotfound') ||
      m.includes('econnrefused') ||
      m.includes('enetunreach') ||
      m.includes('ehostunreach') ||
      m.includes('ecanceled') ||
      m.includes('canceled') ||
      m.includes('cancelled') ||
      m.includes('err_network')
    );
  }
}
