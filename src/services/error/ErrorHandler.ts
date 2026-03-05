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
  AUTHENTICATION_ERROR: {
    displayMessage: 'Invalid credentials',
    retryable: false,
  },
  VALIDATION_ERROR: {
    displayMessage: 'Invalid data provided',
    retryable: false,
  },
  CONFLICT_ERROR: {
    displayMessage: 'Resource already exists',
    retryable: false,
  },
  SERVER_ERROR: {
    displayMessage: 'Internal server error',
    retryable: true,
  },
  NETWORK_ERROR: {
    displayMessage: 'Network error. Please check your connection.',
    retryable: true,
  },
  FORBIDDEN: {
    displayMessage: 'Access forbidden',
    retryable: false,
  },
  NOT_FOUND: {
    displayMessage: 'Resource not found',
    retryable: false,
  },
  TIMEOUT: {
    displayMessage: 'Request timed out',
    retryable: true,
  },
  RATE_LIMITED: {
    displayMessage: 'Too many requests. Please slow down.',
    retryable: true,
  },
  CANCELLED: {
    displayMessage: 'Request was cancelled',
    retryable: false,
  },
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

  public static handle(error: unknown): void {
    // eslint-disable-next-line no-console
    console.error('[ErrorHandler]', error);
  }
}
