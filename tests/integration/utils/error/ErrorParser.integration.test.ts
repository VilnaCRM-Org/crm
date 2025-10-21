import '../../setup';
import { ApiErrorCodes } from '@/modules/User/features/Auth/api/ApiErrors';
import ApiError from '@/modules/User/features/Auth/api/ApiErrors/ApiError';
import ErrorParser from '@/utils/error/ErrorParser';
import type ParsedError from '@/utils/error/types';

describe('ErrorParser Integration', () => {
  describe('parseHttpError method', () => {
    it('should handle Response instance with status 404', () => {
      const mockResponse = new Response('Not Found', { status: 404, statusText: 'Not Found' });

      const result: ParsedError = ErrorParser.parseHttpError(mockResponse);

      expect(result.code).toBe('HTTP_404');
      expect(result.message).toBe('HTTP error 404');
      expect(result.original).toBe(mockResponse);
    });

    it('should handle Response instance with status 500', () => {
      const mockResponse = new Response('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result: ParsedError = ErrorParser.parseHttpError(mockResponse);

      expect(result.code).toBe('HTTP_500');
      expect(result.message).toBe('HTTP error 500');
      expect(result.original).toBe(mockResponse);
    });

    it('should handle Response instance with status 200', () => {
      const mockResponse = new Response('OK', { status: 200, statusText: 'OK' });

      const result: ParsedError = ErrorParser.parseHttpError(mockResponse);

      expect(result.code).toBe('HTTP_200');
      expect(result.message).toBe('HTTP error 200');
      expect(result.original).toBe(mockResponse);
    });

    it('should handle Response instance with status 401', () => {
      const mockResponse = new Response('Unauthorized', { status: 401 });

      const result: ParsedError = ErrorParser.parseHttpError(mockResponse);

      expect(result.code).toBe('HTTP_401');
      expect(result.message).toBe('HTTP error 401');
      expect(result.original).toBe(mockResponse);
    });

    it('should handle ApiError instance', () => {
      const apiError = new ApiError('Authentication failed', ApiErrorCodes.AUTH, 401);

      const result: ParsedError = ErrorParser.parseHttpError(apiError);

      expect(result.code).toBe(ApiErrorCodes.AUTH);
      expect(result.message).toBe('Authentication failed');
      expect(result.original).toBe(apiError);
    });

    it('should handle ApiError with different error codes', () => {
      const apiError = new ApiError('Network error occurred', ApiErrorCodes.NETWORK, 0);

      const result: ParsedError = ErrorParser.parseHttpError(apiError);

      expect(result.code).toBe(ApiErrorCodes.NETWORK);
      expect(result.message).toBe('Network error occurred');
      expect(result.original).toBe(apiError);
    });

    it('should handle regular Error instance', () => {
      const error = new Error('Something went wrong');

      const result: ParsedError = ErrorParser.parseHttpError(error);

      expect(result.code).toBe('JS_ERROR');
      expect(result.message).toBe('Something went wrong');
      expect(result.original).toBe(error);
    });

    it('should handle Error instance with empty message', () => {
      const error = new Error();

      const result: ParsedError = ErrorParser.parseHttpError(error);

      expect(result.code).toBe('JS_ERROR');
      expect(result.message).toBe('');
      expect(result.original).toBe(error);
    });

    it('should handle unknown error types - string', () => {
      const unknownError = 'String error message';

      const result: ParsedError = ErrorParser.parseHttpError(unknownError);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.original).toBe(unknownError);
    });

    it('should handle unknown error types - number', () => {
      const unknownError = 404;

      const result: ParsedError = ErrorParser.parseHttpError(unknownError);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.original).toBe(unknownError);
    });

    it('should handle unknown error types - object', () => {
      const unknownError = { status: 500, data: 'error' };

      const result: ParsedError = ErrorParser.parseHttpError(unknownError);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.original).toBe(unknownError);
    });

    it('should handle null', () => {
      const result: ParsedError = ErrorParser.parseHttpError(null);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.original).toBeNull();
    });

    it('should handle undefined', () => {
      const result: ParsedError = ErrorParser.parseHttpError(undefined);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.original).toBeUndefined();
    });

    it('should handle boolean', () => {
      const result: ParsedError = ErrorParser.parseHttpError(false);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.original).toBe(false);
    });

    it('should handle array', () => {
      const unknownError = ['error1', 'error2'];

      const result: ParsedError = ErrorParser.parseHttpError(unknownError);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.original).toBe(unknownError);
    });

    it('should handle function', () => {
      const unknownError = (): string => 'error';

      const result: ParsedError = ErrorParser.parseHttpError(unknownError);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.original).toBe(unknownError);
    });
  });
});
