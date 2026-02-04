import '../../../setup';

import { ApiError, ApiErrorCodes } from '@/modules/user/features/auth/types/api-errors';
import { handleApiError, isAPIError } from '@/modules/user/lib/errors';
import { HttpError } from '@/services/https-client/http-error';

describe('handleApiError Integration - Edge Cases', () => {
  describe('408 timeout error', () => {
    it('should handle 408 timeout status', () => {
      const httpError = new HttpError({ status: 408, message: 'Request Timeout' });
      const result = handleApiError(httpError, 'Login');

      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Request timed out. Please try again.');
      expect(result.code).toBe(ApiErrorCodes.TIMEOUT);
    });
  });

  describe('network errors', () => {
    it('should handle Error with network-like message', () => {
      const networkError = new Error('Failed to fetch');
      const result = handleApiError(networkError, 'Login');

      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Network error. Please check your connection.');
      expect(result.code).toBe(ApiErrorCodes.NETWORK);
    });

    it('should handle Error with fetch failure message', () => {
      const fetchError = new Error('fetch failed');
      const result = handleApiError(fetchError, 'Registration');

      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Network error. Please check your connection.');
      expect(result.code).toBe(ApiErrorCodes.NETWORK);
    });

    it('should handle Error with network request message', () => {
      const networkError = new Error('Network request failed');
      const result = handleApiError(networkError, 'Login');

      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Network error. Please check your connection.');
      expect(result.code).toBe(ApiErrorCodes.NETWORK);
    });

    it('should handle HttpError with empty message', () => {
      const httpError = new HttpError({ status: 500, message: '' });
      const result = handleApiError(httpError, 'Login');

      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Server error. Please try again later.');
      expect(result.code).toBe(ApiErrorCodes.SERVER);
    });
  });

  describe('abort errors', () => {
    it('should handle AbortError', () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      const result = handleApiError(abortError, 'Login');

      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Request canceled.');
      expect(result.code).toBe(ApiErrorCodes.CANCELLED);
    });

    it('should handle DOMException with abort name', () => {
      const error = new Error('The user aborted a request');
      Object.defineProperty(error, 'name', { value: 'AbortError', writable: true });
      const result = handleApiError(error, 'Login');

      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Request canceled.');
      expect(result.code).toBe(ApiErrorCodes.CANCELLED);
    });

    it('should handle Error with missing name property', () => {
      const error = new Error('abort message');
      Object.defineProperty(error, 'name', { value: undefined });
      const result = handleApiError(error, 'Login');

      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Request canceled.');
      expect(result.code).toBe(ApiErrorCodes.CANCELLED);
    });

    it('should handle Error with missing message property', () => {
      const error = new Error();
      error.name = 'AbortError';
      Object.defineProperty(error, 'message', { value: undefined });
      const result = handleApiError(error, 'Login');

      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Request canceled.');
      expect(result.code).toBe(ApiErrorCodes.CANCELLED);
    });
  });

  describe('generic errors', () => {
    it('should handle generic Error without network indicators', () => {
      const genericError = new Error('Something went wrong');
      const result = handleApiError(genericError, 'Login');

      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Login failed. Please try again.');
      expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
    });

    it('should handle unknown error type', () => {
      const unknownError = { weird: 'object' };
      const result = handleApiError(unknownError, 'Registration');

      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Registration failed. Please try again.');
      expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
    });

    it('should handle null error', () => {
      const result = handleApiError(null, 'Login');

      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Login failed. Please try again.');
      expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
    });

    it('should handle undefined error', () => {
      const result = handleApiError(undefined, 'Registration');

      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Registration failed. Please try again.');
      expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
    });
  });

  describe('barrel export integration', () => {
    it('should have isAPIError available from barrel export', () => {
      expect(isAPIError).toBeDefined();
      expect(typeof isAPIError).toBe('function');
      expect(isAPIError({ code: 'TEST', message: 'test' })).toBe(true);
    });
  });
});
