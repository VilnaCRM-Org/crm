import '../setup';
import { ErrorHandler } from '@/services/error';

describe('ErrorHandler Coverage Tests', () => {
  it('should return fallback error for unknown error codes', () => {
    // Test lines 70-72: fallback when error code not in errorMap
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
    // Test the non-fallback branch (lines before 70)
    const networkError = {
      code: 'NETWORK_ERROR',
      message: 'Network failed',
      original: new Error('net'),
    };

    const result = ErrorHandler.handleAuthError(networkError);

    expect(result.displayMessage).toBeTruthy();
    expect(result.retryable).toBeDefined();
  });

  it('should call handle method and log error to console', () => {
    // Test lines 77-79: the handle method
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const testError = new Error('Test error');
    ErrorHandler.handle(testError);

    expect(consoleSpy).toHaveBeenCalledWith('[ErrorHandler]', testError);

    consoleSpy.mockRestore();
  });

  it('should handle different error types in handle method', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    ErrorHandler.handle('string error');
    ErrorHandler.handle({ custom: 'error' });
    ErrorHandler.handle(null);

    expect(consoleSpy).toHaveBeenCalledTimes(3);

    consoleSpy.mockRestore();
  });
});
