import { ApiError, ValidationError, AuthenticationError, ConflictError } from './ApiErrors';

interface HttpError {
  status: number;
  message: string;
  data?: unknown;
}

export default class BaseAPI {
  protected handleApiError(error: unknown, context: string): ApiError {
    if (this.isHttpError(error)) {
      switch (error.status) {
        case 400:
          return new ValidationError(`Invalid ${context.toLowerCase()} data`);
        case 401:
          return new AuthenticationError();
        case 409:
          return new ConflictError(`${context} conflict. Resource already exists.`);
        case 500:
          return new ApiError('Server error. Please try again later.', 'SERVER_ERROR', 500);
        default:
          return new ApiError(`${context} failed`, 'UNKNOWN_ERROR', error.status);
      }
    }

    if (error instanceof Error && this.isNetworkError(error.message)) {
      return new ApiError('Network error. Please check your connection.', 'NETWORK_ERROR');
    }

    return new ApiError(`${context} failed. Please try again.`, 'UNKNOWN_ERROR');
  }

  private isHttpError(error: unknown): error is HttpError {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const obj = error as Record<string, unknown>;

    return (
      'status' in obj &&
      'message' in obj &&
      typeof obj.status === 'number' &&
      typeof obj.message === 'string'
    );
  }

  private isNetworkError(message: string): boolean {
    return (
      message.toLowerCase().includes('Failed to fetch') ||
      message.toLowerCase().includes('network') ||
      message.toLowerCase().includes('fetch') ||
      message.toLowerCase().includes('connection') ||
      message.toLowerCase().includes('timeout') ||
      message.toLowerCase().includes('cors')
    );
  }
}
