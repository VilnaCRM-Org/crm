import ParsedError from '@/utils/error/types';

import { ERROR_CODES, type ErrorCode } from './errorCodes';

export interface UiError {
  readonly displayMessage: string;
  readonly retryable: boolean;
}
const errorMap: Record<ErrorCode, UiError> = {
  [ERROR_CODES.AUTH_INVALID]: {
    displayMessage: 'Invalid credentials',
    retryable: false,
  },
  [ERROR_CODES.HTTP_401]: {
    displayMessage: 'Unauthorized',
    retryable: false,
  },
  [ERROR_CODES.HTTP_500]: {
    displayMessage: 'Internal server error',
    retryable: false,
  },
  [ERROR_CODES.JS_ERROR]: { displayMessage: 'JavaScript error occurred', retryable: false },
  [ERROR_CODES.UNKNOWN_ERROR]: { displayMessage: 'An unknown error occurred', retryable: false },
};

export class ErrorHandler {
  public static handleAuthError(error: ParsedError): UiError {
    return (
      errorMap[error.code as ErrorCode] ?? {
        displayMessage: 'Something went wrong. Please try again.',
        retryable: false,
      }
    );
  }
}
