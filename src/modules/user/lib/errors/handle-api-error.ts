import { HttpError, isHttpError } from '@/services/https-client/http-error';

import {
  ApiError,
  ValidationError,
  AuthenticationError,
  ConflictError,
  ApiErrorCodes,
} from '@/modules/user/types/api-errors';

function isAbortError(err: Error): boolean {
  const name = err.name?.toLowerCase?.() ?? '';
  const msg = err.message?.toLowerCase?.() ?? '';
  return name === 'aborterror' || msg.includes('abort');
}

const NETWORK_ERROR_KEYWORDS = [
  'failed to fetch',
  'fetch failed',
  'network',
  'connection',
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
] as const;

function isNetworkError(message: string): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return NETWORK_ERROR_KEYWORDS.some((keyword) => m.includes(keyword));
}

function handleHttpError(error: HttpError, context: string): ApiError {
  if (error.status === 0 || isNetworkError(error.message)) {
    return new ApiError(
      'Network error. Please check your connection.',
      ApiErrorCodes.NETWORK,
      undefined,
      error
    );
  }

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
    case 409:
      return new ConflictError(`${context} conflict. Resource already exists.`);
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
    case 500:
      return new ApiError(
        'Server error. Please try again later.',
        ApiErrorCodes.SERVER,
        500,
        error
      );
    case 502:
    case 503:
    case 504:
      return new ApiError(
        'Service unavailable. Please try again later.',
        ApiErrorCodes.SERVER,
        error.status,
        error
      );
    default:
      return new ApiError(`${context} failed`, ApiErrorCodes.UNKNOWN, error.status, error);
  }
}

export default function handleApiError(error: unknown, context: string): ApiError {
  if (isHttpError(error)) return handleHttpError(error, context);

  if (error instanceof Error && isAbortError(error)) {
    return new ApiError('Request canceled.', ApiErrorCodes.CANCELLED, undefined, error);
  }
  if (error instanceof Error && isNetworkError(error.message)) {
    return new ApiError(
      'Network error. Please check your connection.',
      ApiErrorCodes.NETWORK,
      undefined,
      error
    );
  }

  return new ApiError(`${context} failed. Please try again.`, ApiErrorCodes.UNKNOWN);
}
