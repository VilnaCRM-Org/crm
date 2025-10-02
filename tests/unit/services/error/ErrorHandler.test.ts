import { ERROR_CODES } from '@/services/error/errorCodes';
import { ErrorHandler, UiError } from '@/services/error/ErrorHandler';
import ParsedError from '@/utils/error/types';

describe('ErrorHandler', () => {
  describe('handleAuthError', () => {
    describe('recognized error codes', () => {
      it('should handle AUTH_INVALID error', () => {
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: 'Authentication failed',
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'Invalid credentials',
          retryable: false,
        });
      });

      it('should handle HTTP_401 error', () => {
        const error: ParsedError = {
          code: ERROR_CODES.HTTP_401,
          message: 'Unauthorized',
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'Unauthorized',
          retryable: false,
        });
      });

      it('should handle HTTP_500 error', () => {
        const error: ParsedError = {
          code: ERROR_CODES.HTTP_500,
          message: 'Internal server error',
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'Internal server error',
          retryable: false,
        });
      });

      it('should handle JS_ERROR', () => {
        const error: ParsedError = {
          code: ERROR_CODES.JS_ERROR,
          message: 'JavaScript error occurred',
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'JavaScript error occurred',
          retryable: false,
        });
      });

      it('should handle UNKNOWN_ERROR', () => {
        const error: ParsedError = {
          code: ERROR_CODES.UNKNOWN_ERROR,
          message: 'Unknown error',
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'An unknown error occurred',
          retryable: false,
        });
      });
    });

    describe('unrecognized error codes', () => {
      it('should return default error for unrecognized code', () => {
        const error: ParsedError = {
          code: 'SOME_RANDOM_CODE',
          message: 'Some error',
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'Something went wrong. Please try again.',
          retryable: false,
        });
      });

      it('should return default error for empty code', () => {
        const error: ParsedError = {
          code: '',
          message: 'Error message',
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'Something went wrong. Please try again.',
          retryable: false,
        });
      });

      it('should return default error for HTTP_404', () => {
        const error: ParsedError = {
          code: 'HTTP_404',
          message: 'Not found',
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'Something went wrong. Please try again.',
          retryable: false,
        });
      });

      it('should return default error for HTTP_400', () => {
        const error: ParsedError = {
          code: 'HTTP_400',
          message: 'Bad request',
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'Something went wrong. Please try again.',
          retryable: false,
        });
      });

      it('should return default error for custom code', () => {
        const error: ParsedError = {
          code: 'CUSTOM_ERROR_CODE',
          message: 'Custom error message',
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'Something went wrong. Please try again.',
          retryable: false,
        });
      });
    });

    describe('error properties', () => {
      it('should return UiError with displayMessage property', () => {
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: 'Test',
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toHaveProperty('displayMessage');
        expect(typeof result.displayMessage).toBe('string');
      });

      it('should return UiError with retryable property', () => {
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: 'Test',
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toHaveProperty('retryable');
        expect(typeof result.retryable).toBe('boolean');
      });

      it('should always return retryable as false for auth errors', () => {
        const errorCodes = [
          ERROR_CODES.AUTH_INVALID,
          ERROR_CODES.HTTP_401,
          ERROR_CODES.HTTP_500,
          ERROR_CODES.JS_ERROR,
          ERROR_CODES.UNKNOWN_ERROR,
        ];

        errorCodes.forEach((code) => {
          const error: ParsedError = { code, message: 'Test' };
          const result = ErrorHandler.handleAuthError(error);
          expect(result.retryable).toBe(false);
        });
      });
    });

    describe('error with original property', () => {
      it('should handle error with original Error object', () => {
        const originalError = new Error('Original error');
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: 'Auth failed',
          original: originalError,
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'Invalid credentials',
          retryable: false,
        });
      });

      it('should handle error with original as object', () => {
        const original = { status: 401, message: 'Unauthorized' };
        const error: ParsedError = {
          code: ERROR_CODES.HTTP_401,
          message: 'Unauthorized',
          original,
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'Unauthorized',
          retryable: false,
        });
      });

      it('should handle error with original as string', () => {
        const error: ParsedError = {
          code: ERROR_CODES.JS_ERROR,
          message: 'JS error',
          original: 'string error',
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'JavaScript error occurred',
          retryable: false,
        });
      });

      it('should handle error with original as server error', () => {
        const error: ParsedError = {
          code: ERROR_CODES.HTTP_500,
          message: 'Server error',
          original: { status: 500, data: 'error' },
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'Internal server error',
          retryable: false,
        });
      });
    });

    describe('edge cases', () => {
      it('should handle error with very long message', () => {
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: 'A'.repeat(10000),
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result.displayMessage).toBe('Invalid credentials');
      });

      it('should handle error with empty message', () => {
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: '',
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result.displayMessage).toBe('Invalid credentials');
      });

      it('should handle error with Unicode characters in message', () => {
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: 'Помилка автентифікації',
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result.displayMessage).toBe('Invalid credentials');
      });

      it('should handle error with special characters in code', () => {
        const error: ParsedError = {
          code: 'ERROR@#$%',
          message: 'Error',
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result.displayMessage).toBe('Something went wrong. Please try again.');
      });

      it('should handle error code with different casing', () => {
        const error: ParsedError = {
          code: 'auth_invalid',
          message: 'Auth failed',
        };

        const result = ErrorHandler.handleAuthError(error);

        // Should not match due to case sensitivity
        expect(result.displayMessage).toBe('Something went wrong. Please try again.');
      });
    });

    describe('consistency', () => {
      it('should return same result for same error code', () => {
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: 'Test',
        };

        const result1 = ErrorHandler.handleAuthError(error);
        const result2 = ErrorHandler.handleAuthError(error);

        expect(result1).toEqual(result2);
      });

      it('should be deterministic', () => {
        const error: ParsedError = {
          code: ERROR_CODES.HTTP_401,
          message: 'Unauthorized',
        };

        const results = Array.from({ length: 10 }, () => ErrorHandler.handleAuthError(error));
        const allSame = results.every(
          (result) =>
            result.displayMessage === results[0].displayMessage &&
            result.retryable === results[0].retryable
        );

        expect(allSame).toBe(true);
      });
    });

    describe('real-world scenarios', () => {
      it('should handle login failure error', () => {
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: 'Invalid email or password',
          original: new Error('Login failed'),
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'Invalid credentials',
          retryable: false,
        });
      });

      it('should handle session timeout error', () => {
        const error: ParsedError = {
          code: ERROR_CODES.HTTP_401,
          message: 'Session expired',
          original: { status: 401, message: 'Token expired' },
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'Unauthorized',
          retryable: false,
        });
      });

      it('should handle server error during authentication', () => {
        const error: ParsedError = {
          code: ERROR_CODES.HTTP_500,
          message: 'Database connection failed',
          original: new Error('Connection timeout'),
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'Internal server error',
          retryable: false,
        });
      });

      it('should handle network error', () => {
        const error: ParsedError = {
          code: ERROR_CODES.JS_ERROR,
          message: 'Network request failed',
          original: new TypeError('Failed to fetch'),
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'JavaScript error occurred',
          retryable: false,
        });
      });

      it('should handle unexpected error format', () => {
        const error: ParsedError = {
          code: 'WEIRD_ERROR_FORMAT',
          message: 'Something unexpected happened',
        };

        const result = ErrorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'Something went wrong. Please try again.',
          retryable: false,
        });
      });
    });

    describe('type safety', () => {
      it('should return UiError type', () => {
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: 'Test',
        };

        const result: UiError = ErrorHandler.handleAuthError(error);

        expect(result).toBeDefined();
        expect(result.displayMessage).toBeDefined();
        expect(result.retryable).toBeDefined();
      });

      it('should have properties defined in UiError interface', () => {
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: 'Test',
        };

        const result = ErrorHandler.handleAuthError(error);

        // TypeScript enforces readonly at compile-time, not runtime
        expect(result.displayMessage).toBe('Invalid credentials');
        expect(result.retryable).toBe(false);
        expect(typeof result.displayMessage).toBe('string');
        expect(typeof result.retryable).toBe('boolean');
      });
    });

    describe('static method behavior', () => {
      it('should be callable without instantiation', () => {
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: 'Test',
        };

        // Should work without creating ErrorHandler instance
        const result = ErrorHandler.handleAuthError(error);

        expect(result).toBeDefined();
      });

      it('should not require ErrorHandler instance', () => {
        const error: ParsedError = {
          code: ERROR_CODES.HTTP_401,
          message: 'Test',
        };

        // Call directly on class
        expect(() => {
          ErrorHandler.handleAuthError(error);
        }).not.toThrow();
      });
    });

    describe('all error codes coverage', () => {
      it('should handle all defined error codes', () => {
        const testCases: Array<[string, string]> = [
          [ERROR_CODES.AUTH_INVALID, 'Invalid credentials'],
          [ERROR_CODES.HTTP_401, 'Unauthorized'],
          [ERROR_CODES.HTTP_500, 'Internal server error'],
          [ERROR_CODES.JS_ERROR, 'JavaScript error occurred'],
          [ERROR_CODES.UNKNOWN_ERROR, 'An unknown error occurred'],
        ];

        testCases.forEach(([code, expectedMessage]) => {
          const error: ParsedError = { code, message: 'Test' };
          const result = ErrorHandler.handleAuthError(error);
          expect(result.displayMessage).toBe(expectedMessage);
          expect(result.retryable).toBe(false);
        });
      });
    });
  });
});
