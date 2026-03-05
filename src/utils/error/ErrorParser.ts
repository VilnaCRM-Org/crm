import ApiError from '@/modules/User/features/Auth/api/ApiErrors/ApiError';

import ParsedError from './types';

export default class ErrorParser {
  public static parseHttpError(error: unknown): ParsedError {
    if (typeof Response !== 'undefined' && error instanceof Response) {
      return {
        code: `HTTP_${error.status}`,
        message: `HTTP error ${error.status}`,
        original: error,
      };
    }
    if (error instanceof ApiError) {
      return {
        code: error.code,
        message: error.message,
        original: error,
      };
    }
    if (error instanceof Error) {
      return {
        code: 'JS_ERROR',
        message: error.message,
        original: error,
      };
    }
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      original: error,
    };
  }
}
