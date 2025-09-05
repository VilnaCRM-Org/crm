import ParsedError from '@/utils/error/types';

import { ERROR_CODES } from './errorCodes';

export interface ApiError {
  displayMessage: string;
  retryable: boolean;
}

const errorMap: Record<string, ApiError> = {
  [ERROR_CODES.AUTH_INVALID]: {
    displayMessage: 'Invalid credentials',
    retryable: true,
  },
  [ERROR_CODES.HTTP_401]: {
    displayMessage: 'Unauthorized',
    retryable: false,
  },
  [ERROR_CODES.HTTP_500]: {
    displayMessage: 'Internal server error',
    retryable: false,
  },
};

export class ErrorHandler {
  public static handleAuthError(error: ParsedError): ApiError {
    return (
      errorMap[error.code] ?? {
        displayMessage: error.message,
        retryable: true,
      }
    );
  }
}
