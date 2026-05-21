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
    let mappedError: ApiError;

    switch (status) {
      case 400:
        mappedError = new ValidationError({
          message: `Invalid ${context.toLowerCase()} data`,
          status: 400,
        });
        break;
      case 401:
        mappedError = new AuthenticationError();
        break;
      case 403:
        mappedError = new ApiError('Forbidden', ApiErrorCodes.FORBIDDEN, 403, error);
        break;
      case 404:
        mappedError = new ApiError(`${context} not found`, ApiErrorCodes.NOT_FOUND, 404, error);
        break;
      case 408:
        mappedError = new ApiError(
          'Request timed out. Please try again.',
          ApiErrorCodes.TIMEOUT,
          408,
          error
        );
        break;
      case 409:
        mappedError = new ConflictError(`${context} conflict. Resource already exists.`);
        break;
      case 422:
        mappedError = new ValidationError({
          message: `Unprocessable ${context.toLowerCase()} data`,
          status: 422,
        });
        break;
      case 429:
        mappedError = new ApiError(
          'Too many requests. Please slow down.',
          ApiErrorCodes.RATE_LIMITED,
          429,
          error
        );
        break;
      case 500:
        mappedError = new ApiError(
          'Server error. Please try again later.',
          ApiErrorCodes.SERVER,
          500,
          error
        );
        break;
      case 502:
      case 503:
      case 504:
        mappedError = new ApiError(
          'Service unavailable. Please try again later.',
          ApiErrorCodes.SERVER,
          status,
          error
        );
        break;
      default:
        mappedError = new ApiError(`${context} failed`, ApiErrorCodes.UNKNOWN, status, error);
    }

    return mappedError;
  }

  private isAbortError(err: Error): boolean {
    const name = err.name?.toLowerCase?.() ?? '';
    const msg = err.message?.toLowerCase?.() ?? '';
    return name === 'aborterror' || msg.includes('abort');
  }

  private isNetworkError(message: unknown): boolean {
    if (typeof message !== 'string' || !message) return false;
    const m = message.toLowerCase();
    return BaseAPI.NETWORK_ERROR_KEYWORDS.some((keyword) => m.includes(keyword));
  }
}
