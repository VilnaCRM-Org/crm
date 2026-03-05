import '../../setup';
import ApiError from '@/modules/User/features/Auth/api/ApiErrors/ApiError';
import { ErrorParser } from '@/utils/error';

describe('ErrorParser Comprehensive Coverage', () => {
  describe('parseHttpError - Response instances', () => {
    it('should parse Response instance with status 404', () => {
      const response = new Response(null, { status: 404, statusText: 'Not Found' });

      const result = ErrorParser.parseHttpError(response);

      expect(result.code).toBe('HTTP_404');
      expect(result.message).toBe('HTTP error 404');
      expect(result.original).toBe(response);
    });

    it('should parse Response instance with status 500', () => {
      const response = new Response(null, { status: 500, statusText: 'Internal Server Error' });

      const result = ErrorParser.parseHttpError(response);

      expect(result.code).toBe('HTTP_500');
      expect(result.message).toBe('HTTP error 500');
      expect(result.original).toBe(response);
    });

    it('should parse Response instance with status 401', () => {
      const response = new Response(null, { status: 401, statusText: 'Unauthorized' });

      const result = ErrorParser.parseHttpError(response);

      expect(result.code).toBe('HTTP_401');
      expect(result.message).toBe('HTTP error 401');
      expect(result.original).toBe(response);
    });

    it('should parse Response instance with status 200', () => {
      const response = new Response(null, { status: 200 });

      const result = ErrorParser.parseHttpError(response);

      expect(result.code).toBe('HTTP_200');
      expect(result.message).toBe('HTTP error 200');
      expect(result.original).toBe(response);
    });
  });

  describe('parseHttpError - ApiError instances', () => {
    it('should parse ApiError with known code', () => {
      const apiError = new ApiError('Authentication failed', 'AUTH_FAILED', 401);

      const result = ErrorParser.parseHttpError(apiError);

      expect(result.code).toBe('AUTH_FAILED');
      expect(result.message).toBe('Authentication failed');
      expect(result.original).toBe(apiError);
    });

    it('should parse ApiError with custom message', () => {
      const apiError = new ApiError('Custom error message', 'CUSTOM_ERROR', undefined);

      const result = ErrorParser.parseHttpError(apiError);

      expect(result.code).toBe('CUSTOM_ERROR');
      expect(result.message).toBe('Custom error message');
      expect(result.original).toBe(apiError);
    });

    it('should parse ApiError with network error code', () => {
      const apiError = new ApiError('Network error', 'NETWORK_ERROR', 0);

      const result = ErrorParser.parseHttpError(apiError);

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.message).toBe('Network error');
      expect(result.original).toBe(apiError);
    });
  });

  describe('parseHttpError - Error instances', () => {
    it('should parse standard Error', () => {
      const error = new Error('Something went wrong');

      const result = ErrorParser.parseHttpError(error);

      expect(result.code).toBe('JS_ERROR');
      expect(result.message).toBe('Something went wrong');
      expect(result.original).toBe(error);
    });

    it('should parse TypeError', () => {
      const error = new TypeError('Type mismatch');

      const result = ErrorParser.parseHttpError(error);

      expect(result.code).toBe('JS_ERROR');
      expect(result.message).toBe('Type mismatch');
      expect(result.original).toBe(error);
    });

    it('should parse RangeError', () => {
      const error = new RangeError('Value out of range');

      const result = ErrorParser.parseHttpError(error);

      expect(result.code).toBe('JS_ERROR');
      expect(result.message).toBe('Value out of range');
      expect(result.original).toBe(error);
    });

    it('should parse Error with empty message', () => {
      const error = new Error('');

      const result = ErrorParser.parseHttpError(error);

      expect(result.code).toBe('JS_ERROR');
      expect(result.message).toBe('');
      expect(result.original).toBe(error);
    });

    it('should parse Error with very long message', () => {
      const longMessage = 'a'.repeat(1000);
      const error = new Error(longMessage);

      const result = ErrorParser.parseHttpError(error);

      expect(result.code).toBe('JS_ERROR');
      expect(result.message).toBe(longMessage);
      expect(result.original).toBe(error);
    });
  });

  describe('parseHttpError - unknown types', () => {
    it('should parse string error', () => {
      const result = ErrorParser.parseHttpError('string error');

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.original).toBe('string error');
    });

    it('should parse number error', () => {
      const result = ErrorParser.parseHttpError(42);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.original).toBe(42);
    });

    it('should parse null error', () => {
      const result = ErrorParser.parseHttpError(null);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.original).toBe(null);
    });

    it('should parse undefined error', () => {
      const result = ErrorParser.parseHttpError(undefined);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.original).toBe(undefined);
    });

    it('should parse object error', () => {
      const obj = { error: 'custom' };
      const result = ErrorParser.parseHttpError(obj);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.original).toBe(obj);
    });

    it('should parse array error', () => {
      const arr = ['error1', 'error2'];
      const result = ErrorParser.parseHttpError(arr);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.original).toBe(arr);
    });

    it('should parse boolean error', () => {
      const result = ErrorParser.parseHttpError(false);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.original).toBe(false);
    });

    it('should parse symbol error', () => {
      const sym = Symbol('error');
      const result = ErrorParser.parseHttpError(sym);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.original).toBe(sym);
    });
  });
});
