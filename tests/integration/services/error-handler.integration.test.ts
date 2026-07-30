import '../setup';
import { ErrorHandler } from '@/services/error';
import type { ObservabilityService } from '@/services/types/observability/observability';

const createObservability = (): jest.Mocked<ObservabilityService> => ({
  init: jest.fn(),
  captureError: jest.fn(),
  setUser: jest.fn(),
  clearUser: jest.fn(),
  reportVital: jest.fn(),
});

const observability = createObservability();
const errorHandler = new ErrorHandler(observability);

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
    const error = new Error('No console available');

    expect(() => errorHandler.handle(error)).not.toThrow();
    expect(observability.captureError).toHaveBeenCalledWith(error);
  });

  it('exposes instance methods for auth-error mapping and error handling', () => {
    const injected = createObservability();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    try {
      const handler = new ErrorHandler(injected);
      const parsedError = {
        code: 'NETWORK_ERROR',
        message: 'Network failed',
      };
      const handledError = new Error('instance handle');

      const result = handler.handleAuthError(parsedError);
      handler.handle(handledError);

      expect(result.displayMessage).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith('[ErrorHandler]', handledError);
      expect(injected.captureError).toHaveBeenCalledWith(handledError);
      expect(observability.captureError).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
