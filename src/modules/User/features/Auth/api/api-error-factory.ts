import ApiStatusErrorFactory, {
  type HttpErrorLike,
} from '@/modules/User/features/Auth/api/api-status-error-factory';
import { ApiError, ApiErrorCodes } from '@/modules/User/features/Auth/api/ApiErrors';
import { isHttpError } from '@/services/HttpsClient/HttpError';

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
  'err_network',
];

const CANCELLATION_KEYWORDS = ['abort', 'aborted', 'ecanceled', 'canceled', 'cancelled'];

export default class ApiErrorFactory {
  public convert(error: unknown, context: string): ApiError {
    if (isHttpError(error)) return ApiErrorFactory.fromHttpError(error, context);
    if (error instanceof Error) return ApiErrorFactory.fromGenericError(error, context);
    return ApiErrorFactory.fromUnknownError(context);
  }

  public static fromHttpError(error: HttpErrorLike, context: string): ApiError {
    const isNetworkStatus =
      error.status === 0 || (!error.status && ApiErrorFactory.isNetworkMessage(error.message));

    if (ApiErrorFactory.isCancellationMessage(error.message)) {
      return ApiErrorFactory.cancelledError(error);
    }

    return isNetworkStatus
      ? ApiErrorFactory.networkError(error)
      : ApiErrorFactory.fromStatusError(error, context);
  }

  public static fromGenericError(error: Error, context: string): ApiError {
    if (ApiErrorFactory.isAbortError(error)) return ApiErrorFactory.cancelledError(error);
    if (ApiErrorFactory.isNetworkMessage(error.message)) return ApiErrorFactory.networkError(error);
    return new ApiError({
      message: `${context} failed. Please try again.`,
      code: ApiErrorCodes.UNKNOWN,
      cause: error,
    });
  }

  public static fromUnknownError(context: string): ApiError {
    return new ApiError({
      message: `${context} failed. Please try again.`,
      code: ApiErrorCodes.UNKNOWN,
    });
  }

  private static fromStatusError(error: HttpErrorLike, context: string): ApiError {
    return ApiStatusErrorFactory.fromHttpError(error, context);
  }

  private static isAbortError(err: Error): boolean {
    const name = err.name?.toLowerCase?.() ?? '';
    return name === 'aborterror' || ApiErrorFactory.isCancellationMessage(err.message);
  }

  private static isCancellationMessage(message: string): boolean {
    if (!message) return false;
    const normalized = message.toLowerCase();
    for (const keyword of CANCELLATION_KEYWORDS) {
      if (normalized.includes(keyword)) return true;
    }
    return false;
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
    return new ApiError({
      message: 'Network error. Please check your connection.',
      code: ApiErrorCodes.NETWORK,
      cause: error,
    });
  }

  private static cancelledError(error: unknown): ApiError {
    return new ApiError({
      message: 'Request canceled.',
      code: ApiErrorCodes.CANCELLED,
      cause: error,
    });
  }
}
