import '../setup';
import { ErrorHandler } from '@/services/error';

const errorHandler = new ErrorHandler();

describe('ErrorHandler Coverage Tests', () => {
  it('should return fallback error for unknown error codes', () => {
    const unknownError = {
      code: 'UNKNOWN_CODE_9999',
      message: 'Unknown error',
      original: new Error('test'),
    };

    const result = errorHandler.handleAuthError(unknownError);

    expect(result.displayMessage).toBe('Something went wrong. Please try again.');
    expect(result.retryable).toBe(false);
  });

  it('should handle error with completely invalid code', () => {
    const invalidError = {
      code: '',
      message: 'Invalid',
      original: null,
    };

    const result = errorHandler.handleAuthError(invalidError);

    expect(result.displayMessage).toBe('Something went wrong. Please try again.');
    expect(result.retryable).toBe(false);
  });

  it('should handle errors with special characters in code', () => {
    const specialError = {
      code: '!@#$%^&*()',
      message: 'Special',
      original: {},
    };

    const result = errorHandler.handleAuthError(specialError);

    expect(result.displayMessage).toBe('Something went wrong. Please try again.');
    expect(result.retryable).toBe(false);
  });

  it('should return mapped error for known error codes', () => {
    const networkError = {
      code: 'NETWORK_ERROR',
      message: 'Network failed',
      original: new Error('net'),
    };

    const result = errorHandler.handleAuthError(networkError);

    expect(result.displayMessage).toBeTruthy();
    expect(result.retryable).toBeDefined();
  });

  afterEach(() => {
    errorHandler.setLogger(undefined);
  });

  it('should call handle method and log error through the configured logger', () => {
    const logger = { error: jest.fn() };
    errorHandler.setLogger(logger);

    const testError = new Error('Test error');
    errorHandler.handle(testError);

    expect(logger.error).toHaveBeenCalledWith('[ErrorHandler]', testError);
  });

  it('should handle different error types in handle method', () => {
    const logger = { error: jest.fn() };
    errorHandler.setLogger(logger);

    errorHandler.handle('string error');
    errorHandler.handle({ custom: 'error' });
    errorHandler.handle(null);

    expect(logger.error).toHaveBeenCalledTimes(3);
  });

  it('should safely no-op when no logger is configured', () => {
    expect(() => errorHandler.handle(new Error('No console available'))).not.toThrow();
  });

  it('exposes instance methods that delegate to the static handlers', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    try {
      const handler = new ErrorHandler();
      const parsedError = {
        code: 'NETWORK_ERROR',
        message: 'Network failed',
      };

      const result = handler.handleAuthError(parsedError);
      handler.handle(new Error('instance handle'));

      expect(result.displayMessage).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith('[ErrorHandler]', expect.any(Error));
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it('exposes instance methods that delegate to the static handlers', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    try {
      const handler = new ErrorHandler();
      const parsedError = {
        code: 'NETWORK_ERROR',
        message: 'Network failed',
      };

      const result = handler.handleAuthError(parsedError);
      handler.handle(new Error('instance handle'));

      expect(result.displayMessage).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith('[ErrorHandler]', expect.any(Error));
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
