import ApiStatusErrorFactory, { HttpErrorLike } from './api-status-error-factory';
import { ApiError, ApiErrorCodes } from './ApiErrors';

const NETWORK_KEYWORDS = [
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

export default class ApiErrorFactory {
  public static fromHttpError(error: HttpErrorLike, context: string): ApiError {
    if (error.status === 0 || ApiErrorFactory.isNetworkMessage(error.message))
      return ApiErrorFactory.networkError(error);
    return ApiErrorFactory.fromStatusError(error, context);
  }

  public static fromGenericError(error: Error, context: string): ApiError {
    if (ApiErrorFactory.isAbortError(error))
      return new ApiError('Request canceled.', ApiErrorCodes.CANCELLED, undefined, error);
    if (ApiErrorFactory.isNetworkMessage(error.message)) return ApiErrorFactory.networkError(error);
    return new ApiError(`${context} failed. Please try again.`, ApiErrorCodes.UNKNOWN);
  }

  public static fromUnknownError(context: string): ApiError {
    return new ApiError(`${context} failed. Please try again.`, ApiErrorCodes.UNKNOWN);
  }

  private static fromStatusError(error: HttpErrorLike, context: string): ApiError {
    return ApiStatusErrorFactory.fromHttpError(error, context);
  }

  private static isAbortError(err: Error): boolean {
    const name = err.name?.toLowerCase?.() ?? '';
    const msg = err.message?.toLowerCase?.() ?? '';
    return name === 'aborterror' || msg.includes('abort');
  }

  private static isNetworkMessage(message: string): boolean {
    if (!message) return false;
    const normalized = message.toLowerCase();
    for (const keyword of NETWORK_KEYWORDS) {
      if (normalized.includes(keyword)) return true;
    }
    return false;
  }

  private static networkError(error: unknown): ApiError {
    return new ApiError(
      'Network error. Please check your connection.',
      ApiErrorCodes.NETWORK,
      undefined,
      error
    );
  }
}
