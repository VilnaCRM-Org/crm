import {
  ApiError,
  ValidationError,
  AuthenticationError,
  ConflictError,
  ApiErrorCodes,
} from '@/modules/user/types/api-errors';
import { isHttpError } from '@/services/https-client/http-error';

export default class BaseAPI {
  private static readonly NETWORK_ERROR_KEYWORDS = [
    'failed to fetch',
    'network',
    'connection',
    'timeout',
    'cors',
    'econnreset',
    'enotfound',
    'econnrefused',
    'enetunreach',
    'ehostunreach',
    'ecanceled',
    'canceled',
    'cancelled',
    'err_network',
  ];

  protected handleApiError(error: unknown, context: string): ApiError {
    if (isHttpError(error)) {
      if (error.status === 0 || this.isNetworkError(error.message)) {
        return new ApiError(
          'Network error. Please check your connection.',
          ApiErrorCodes.NETWORK,
          undefined,
          error
        );
      }
      return this.mapHttpStatusToError(error.status, context, error);
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

  private mapHttpStatusToError(status: number, context: string, error: unknown): ApiError {
    const byStatus: Record<number, () => ApiError> = {
      400: () => new ValidationError({ message: `Invalid ${context.toLowerCase()} data`, status: 400 }),
      401: () => new AuthenticationError(),
      403: () => new ApiError('Forbidden', ApiErrorCodes.FORBIDDEN, 403, error),
      404: () => new ApiError(`${context} not found`, ApiErrorCodes.NOT_FOUND, 404, error),
      408: () => new ApiError('Request timed out. Please try again.', ApiErrorCodes.TIMEOUT, 408, error),
      422: () => new ValidationError({ message: `Unprocessable ${context.toLowerCase()} data`, status: 422 }),
      429: () => new ApiError('Too many requests. Please slow down.', ApiErrorCodes.RATE_LIMITED, 429, error),
      409: () => new ConflictError(`${context} conflict. Resource already exists.`),
      502: () => new ApiError('Service unavailable. Please try again later.', ApiErrorCodes.SERVER, status, error),
      503: () => new ApiError('Service unavailable. Please try again later.', ApiErrorCodes.SERVER, status, error),
      504: () => new ApiError('Service unavailable. Please try again later.', ApiErrorCodes.SERVER, status, error),
      500: () => new ApiError('Server error. Please try again later.', ApiErrorCodes.SERVER, 500, error),
    };
    const factory = byStatus[status];
    return factory
      ? factory()
      : new ApiError(`${context} failed`, ApiErrorCodes.UNKNOWN, status, error);
  }

  private isAbortError(err: Error): boolean {
    const name = err.name?.toLowerCase?.() ?? '';
    const msg = err.message?.toLowerCase?.() ?? '';
    return name === 'aborterror' || msg.includes('abort');
  }

  private isNetworkError(message: string): boolean {
    if (!message) return false;
    const m = message.toLowerCase();
    return BaseAPI.NETWORK_ERROR_KEYWORDS.some((keyword) => m.includes(keyword));
  }
}
