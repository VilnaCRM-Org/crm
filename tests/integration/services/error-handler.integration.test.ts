import '../setup';
import { ErrorHandler } from '@/services/error';

describe('ErrorHandler Coverage Tests', () => {
  it('should return fallback error for unknown error codes', () => {
    const unknownError = {
      code: 'UNKNOWN_CODE_9999',
      message: 'Unknown error',
      original: new Error('test'),
    };

    const result = ErrorHandler.handleAuthError(unknownError);

    expect(result.displayMessage).toBe('Something went wrong. Please try again.');
    expect(result.retryable).toBe(false);
  });

  it('should handle error with completely invalid code', () => {
    const invalidError = {
      code: '',
      message: 'Invalid',
      original: null,
    };

    const result = ErrorHandler.handleAuthError(invalidError);

    expect(result.displayMessage).toBe('Something went wrong. Please try again.');
    expect(result.retryable).toBe(false);
  });

  it('should handle errors with special characters in code', () => {
    const specialError = {
      code: '!@#$%^&*()',
      message: 'Special',
      original: {},
    };

    const result = ErrorHandler.handleAuthError(specialError);

    expect(result.displayMessage).toBe('Something went wrong. Please try again.');
    expect(result.retryable).toBe(false);
  });

  it('should return mapped error for known error codes', () => {
    const networkError = {
      code: 'NETWORK_ERROR',
      message: 'Network failed',
      original: new Error('net'),
    };

    const result = ErrorHandler.handleAuthError(networkError);

    expect(result.displayMessage).toBeTruthy();
    expect(result.retryable).toBeDefined();
  });

  afterEach(() => {
    ErrorHandler.setLogger(undefined);
  });

  it('should call handle method and log error through the configured logger', () => {
    const logger = { error: jest.fn() };
    ErrorHandler.setLogger(logger);

    const testError = new Error('Test error');
    ErrorHandler.handle(testError);

    expect(logger.error).toHaveBeenCalledWith('[ErrorHandler]', testError);
  });

  it('should handle different error types in handle method', () => {
    const logger = { error: jest.fn() };
    ErrorHandler.setLogger(logger);

    ErrorHandler.handle('string error');
    ErrorHandler.handle({ custom: 'error' });
    ErrorHandler.handle(null);

    expect(logger.error).toHaveBeenCalledTimes(3);
  });

  it('should safely no-op when no logger is configured', () => {
    expect(() => ErrorHandler.handle(new Error('No console available'))).not.toThrow();
  });
});
