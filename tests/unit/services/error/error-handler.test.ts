import { ERROR_CODES } from '@/services/error/error-codes';
import { ErrorHandler, UiError } from '@/services/error/error-handler';
import ParsedError from '@/utils/error/types';

const errorHandler = new ErrorHandler();

describe('ErrorHandler', () => {
  describe('handleAuthError', () => {
    describe('recognized error codes', () => {
      it('should handle AUTH_INVALID error', () => {
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: 'Authentication failed',
        };

        const result = errorHandler.handleAuthError(error);

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

        const result = errorHandler.handleAuthError(error);

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

        const result = errorHandler.handleAuthError(error);

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

        const result = errorHandler.handleAuthError(error);

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

        const result = errorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'An unknown error occurred',
          retryable: false,
        });
      });

      it('should handle SERVICE_UNAVAILABLE_ERROR as retryable', () => {
        const error: ParsedError = {
          code: ERROR_CODES.SERVICE_UNAVAILABLE_ERROR,
          message: 'Service unavailable',
        };

        const result = errorHandler.handleAuthError(error);

        expect(result).toEqual({
          displayMessage: 'Service unavailable. Please try again later.',
          retryable: true,
        });
      });
    });

    describe('unrecognized error codes', () => {
      it('should return default error for unrecognized code', () => {
        const error: ParsedError = {
          code: 'SOME_RANDOM_CODE',
          message: 'Some error',
        };

        const result = errorHandler.handleAuthError(error);

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

        const result = errorHandler.handleAuthError(error);

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

        const result = errorHandler.handleAuthError(error);

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

        const result = errorHandler.handleAuthError(error);

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

        const result = errorHandler.handleAuthError(error);

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

        const result = errorHandler.handleAuthError(error);

        expect(result).toHaveProperty('displayMessage');
        expect(typeof result.displayMessage).toBe('string');
      });

      it('should return UiError with retryable property', () => {
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: 'Test',
        };

        const result = errorHandler.handleAuthError(error);

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
          const result = errorHandler.handleAuthError(error);
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

        const result = errorHandler.handleAuthError(error);

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

        const result = errorHandler.handleAuthError(error);

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

        const result = errorHandler.handleAuthError(error);

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

        const result = errorHandler.handleAuthError(error);

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

        const result = errorHandler.handleAuthError(error);

        expect(result.displayMessage).toBe('Invalid credentials');
      });

      it('should handle error with empty message', () => {
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: '',
        };

        const result = errorHandler.handleAuthError(error);

        expect(result.displayMessage).toBe('Invalid credentials');
      });

      it('should handle error with Unicode characters in message', () => {
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: 'Помилка автентифікації',
        };

        const result = errorHandler.handleAuthError(error);

        expect(result.displayMessage).toBe('Invalid credentials');
      });

      it('should handle error with special characters in code', () => {
        const error: ParsedError = {
          code: 'ERROR@#$%',
          message: 'Error',
        };

        const result = errorHandler.handleAuthError(error);

        expect(result.displayMessage).toBe('Something went wrong. Please try again.');
      });

      it('should handle error code with different casing', () => {
        const error: ParsedError = {
          code: 'auth_invalid',
          message: 'Auth failed',
        };

        const result = errorHandler.handleAuthError(error);

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

        const result1 = errorHandler.handleAuthError(error);
        const result2 = errorHandler.handleAuthError(error);

        expect(result1).toEqual(result2);
      });

      it('should be deterministic', () => {
        const error: ParsedError = {
          code: ERROR_CODES.HTTP_401,
          message: 'Unauthorized',
        };

        const results = Array.from({ length: 10 }, () => errorHandler.handleAuthError(error));
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

        const result = errorHandler.handleAuthError(error);

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

        const result = errorHandler.handleAuthError(error);

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

        const result = errorHandler.handleAuthError(error);

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

        const result = errorHandler.handleAuthError(error);

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

        const result = errorHandler.handleAuthError(error);

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

        const result: UiError = errorHandler.handleAuthError(error);

        expect(result).toBeDefined();
        expect(result.displayMessage).toBeDefined();
        expect(result.retryable).toBeDefined();
      });

      it('should have properties defined in UiError interface', () => {
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: 'Test',
        };

        const result = errorHandler.handleAuthError(error);

        // TypeScript enforces readonly at compile-time, not runtime
        expect(result.displayMessage).toBe('Invalid credentials');
        expect(result.retryable).toBe(false);
        expect(typeof result.displayMessage).toBe('string');
        expect(typeof result.retryable).toBe('boolean');
      });
    });

    describe('instance method behavior', () => {
      it('handles auth errors when called on the instance', () => {
        const error: ParsedError = {
          code: ERROR_CODES.AUTH_INVALID,
          message: 'Test',
        };

        const result = errorHandler.handleAuthError(error);

        expect(result).toBeDefined();
      });

      it('does not throw when handling a known error code on the instance', () => {
        const error: ParsedError = {
          code: ERROR_CODES.HTTP_401,
          message: 'Test',
        };

        expect(() => {
          errorHandler.handleAuthError(error);
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
          const result = errorHandler.handleAuthError(error);
          expect(result.displayMessage).toBe(expectedMessage);
          expect(result.retryable).toBe(false);
        });
      });
    });
  });

  describe('handle', () => {
    let logger: { error: jest.Mock };

    beforeEach(() => {
      logger = { error: jest.fn() };
      errorHandler.setLogger(undefined);
    });

    afterEach(() => {
      errorHandler.setLogger(undefined);
    });

    it('logs errors through the configured logger', () => {
      const error = new Error('Test error');
      errorHandler.setLogger(logger);
      errorHandler.handle(error);

      expect(logger.error).toHaveBeenCalledWith('[ErrorHandler]', error);
    });

    it('logs unknown error types through the configured logger', () => {
      const unknownError = { message: 'Unknown error' };
      errorHandler.setLogger(logger);
      errorHandler.handle(unknownError);

      expect(logger.error).toHaveBeenCalledWith('[ErrorHandler]', unknownError);
    });

    it('logs string errors through the configured logger', () => {
      const stringError = 'String error';
      errorHandler.setLogger(logger);
      errorHandler.handle(stringError);

      expect(logger.error).toHaveBeenCalledWith('[ErrorHandler]', stringError);
    });

    it('logs null errors through the configured logger', () => {
      errorHandler.setLogger(logger);
      errorHandler.handle(null);

      expect(logger.error).toHaveBeenCalledWith('[ErrorHandler]', null);
    });

    it('logs undefined errors through the configured logger', () => {
      errorHandler.setLogger(logger);
      errorHandler.handle(undefined);

      expect(logger.error).toHaveBeenCalledWith('[ErrorHandler]', undefined);
    });

    it('logs number errors through the configured logger', () => {
      errorHandler.setLogger(logger);
      errorHandler.handle(42);

      expect(logger.error).toHaveBeenCalledWith('[ErrorHandler]', 42);
    });

    it('logs boolean errors through the configured logger', () => {
      errorHandler.setLogger(logger);
      errorHandler.handle(false);

      expect(logger.error).toHaveBeenCalledWith('[ErrorHandler]', false);
    });

    it('logs array errors through the configured logger', () => {
      const arrayError = ['error1', 'error2'];
      errorHandler.setLogger(logger);
      errorHandler.handle(arrayError);

      expect(logger.error).toHaveBeenCalledWith('[ErrorHandler]', arrayError);
    });

    it('falls back to console when no logger is configured', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('No console');

      expect(() => errorHandler.handle(error)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('[ErrorHandler]', error);
      expect(logger.error).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('instance methods', () => {
    it('should delegate handleAuthError to static implementation', () => {
      const handler = new ErrorHandler();
      const error: ParsedError = {
        code: ERROR_CODES.AUTH_INVALID,
        message: 'Auth failed',
      };

      expect(handler.handleAuthError(error)).toEqual({
        displayMessage: 'Invalid credentials',
        retryable: false,
      });
    });

    it('should delegate handle to static implementation', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      try {
        const handler = new ErrorHandler();
        const error = new Error('instance test');

        handler.handle(error);

        expect(consoleErrorSpy).toHaveBeenCalledWith('[ErrorHandler]', error);
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });
  });

  describe('instance methods', () => {
    it('should delegate handleAuthError to static implementation', () => {
      const handler = new ErrorHandler();
      const error: ParsedError = {
        code: ERROR_CODES.AUTH_INVALID,
        message: 'Auth failed',
      };

      expect(handler.handleAuthError(error)).toEqual({
        displayMessage: 'Invalid credentials',
        retryable: false,
      });
    });

    it('should delegate handle to static implementation', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      try {
        const handler = new ErrorHandler();
        const error = new Error('instance test');

        handler.handle(error);

        expect(consoleErrorSpy).toHaveBeenCalledWith('[ErrorHandler]', error);
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });
  });
});
