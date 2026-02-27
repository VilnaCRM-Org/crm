import {
  ApiError,
  ApiErrorCodes,
  AuthenticationError,
  ConflictError,
  ValidationError,
} from '@/modules/User/features/Auth/api/ApiErrors';
import BaseAPI from '@/modules/User/features/Auth/api/BaseAPI';
import isAPIError from '@/modules/User/helpers/isAPIError';
import { HttpError } from '@/services/HttpsClient/HttpError';

class TestAPI extends BaseAPI {
  public testHandleApiError(error: unknown, context: string): ApiError {
    return this.handleApiError(error, context);
  }
}

describe('BaseAPI', () => {
  let api: TestAPI;

  beforeEach(() => {
    api = new TestAPI();
  });

  describe('handleApiError with HTTP errors', () => {
    it('should handle 400 Bad Request', () => {
      const error = new HttpError({ message: 'Bad Request', status: 400 });
      const result = api.testHandleApiError(error, 'Login');

      expect(isAPIError(result)).toBe(true);
      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toBe('Invalid login data');
      expect(result.code).toBe(ApiErrorCodes.VALIDATION);
    });

    it('should handle 401 Unauthorized', () => {
      const error = new HttpError({ message: 'Unauthorized', status: 401 });
      const result = api.testHandleApiError(error, 'Login');

      expect(isAPIError(result)).toBe(true);
      expect(result).toBeInstanceOf(AuthenticationError);
      expect(result.code).toBe(ApiErrorCodes.AUTH);
    });

    it('should handle 403 Forbidden', () => {
      const error = new HttpError({ message: 'Forbidden', status: 403 });
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Forbidden');
      expect(result.code).toBe(ApiErrorCodes.FORBIDDEN);
    });

    it('should handle 404 Not Found', () => {
      const error = new HttpError({ message: 'Not Found', status: 404 });
      const result = api.testHandleApiError(error, 'User');

      expect(result.message).toBe('User not found');
      expect(result.code).toBe(ApiErrorCodes.NOT_FOUND);
    });

    it('should handle 408 Request Timeout', () => {
      const error = new HttpError({ message: 'Too slow', status: 408 });
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Request timed out. Please try again.');
      expect(result.code).toBe(ApiErrorCodes.TIMEOUT);
    });

    it('should handle 409 Conflict', () => {
      const error = new HttpError({ message: 'Conflict', status: 409 });
      const result = api.testHandleApiError(error, 'Registration');

      expect(isAPIError(result)).toBe(true);
      expect(result).toBeInstanceOf(ConflictError);
      expect(result.message).toBe('Registration conflict. Resource already exists.');
      expect(result.code).toBe(ApiErrorCodes.CONFLICT);
    });

    it('should handle 422 Unprocessable Entity', () => {
      const error = new HttpError({ message: 'Unprocessable Entity', status: 422 });
      const result = api.testHandleApiError(error, 'Login');

      expect(isAPIError(result)).toBe(true);
      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toBe('Unprocessable login data');
      expect(result.code).toBe(ApiErrorCodes.VALIDATION);
    });

    it('should handle 429 Too Many Requests', () => {
      const error = new HttpError({ message: 'Too Many Requests', status: 429 });
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Too many requests. Please slow down.');
      expect(result.code).toBe(ApiErrorCodes.RATE_LIMITED);
    });

    it('should handle 500 Internal Server Error', () => {
      const error = new HttpError({ message: 'Internal Server Error', status: 500 });
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Server error. Please try again later.');
      expect(result.code).toBe(ApiErrorCodes.SERVER);
    });

    it('should handle 502 Bad Gateway', () => {
      const error = new HttpError({ message: 'Bad Gateway', status: 502 });
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Service unavailable. Please try again later.');
      expect(result.code).toBe(ApiErrorCodes.SERVER);
    });

    it('should handle 503 Service Unavailable', () => {
      const error = new HttpError({ message: 'Service Unavailable', status: 503 });
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Service unavailable. Please try again later.');
      expect(result.code).toBe(ApiErrorCodes.SERVER);
    });

    it('should handle 504 Gateway Timeout', () => {
      const error = new HttpError({ message: 'Gateway unavailable', status: 504 });
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Service unavailable. Please try again later.');
      expect(result.code).toBe(ApiErrorCodes.SERVER);
    });

    it('should handle unknown HTTP status codes', () => {
      const error = new HttpError({ message: 'Unknown Error', status: 418 });
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Login failed');
      expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
    });

    it('should handle network error with status 0', () => {
      const error = new HttpError({ message: 'Network Error', status: 0 });
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Network error. Please check your connection.');
      expect(result.code).toBe(ApiErrorCodes.NETWORK);
    });

    it('should detect network error from message', () => {
      const error = new HttpError({ message: 'Failed to fetch', status: 500 });
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Network error. Please check your connection.');
      expect(result.code).toBe(ApiErrorCodes.NETWORK);
    });
  });

  describe('handleApiError with non-HTTP errors', () => {
    it('should handle AbortError', () => {
      const error = new DOMException('The operation was aborted', 'AbortError');
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Request canceled.');
      expect(result.code).toBe(ApiErrorCodes.CANCELLED);
    });

    it('should detect abort error from message containing "abort"', () => {
      const error = new Error('Request abort detected');
      const result = api.testHandleApiError(error, 'Login');

      expect(result.code).toBe(ApiErrorCodes.CANCELLED);
    });

    it('should handle error object with no name property', () => {
      const error = { message: 'Some error' };
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Login failed. Please try again.');
      expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
    });

    it('should handle error object with undefined message', () => {
      const error = new Error();
      error.message = undefined as unknown as string;
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Login failed. Please try again.');
      expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
    });

    it('should handle error object with name property but no toLowerCase method', () => {
      const error = { name: 'CustomError' as unknown, message: 'test error' };
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Login failed. Please try again.');
      expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
    });

    it('should handle error with null name property', () => {
      const error = new Error('test error');
      Object.defineProperty(error, 'name', { value: null, configurable: true });
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Login failed. Please try again.');
      expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
    });

    it('should handle error with name as number', () => {
      const error = new Error('test error');
      Object.defineProperty(error, 'name', { value: 123, configurable: true });
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Login failed. Please try again.');
      expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
    });

    it('should handle network errors from Error message', () => {
      const networkMessages = [
        'failed to fetch',
        'network error',
        'connection refused',
        'timeout error',
        'cors error',
        'ECONNRESET',
        'ENOTFOUND',
        'ECONNREFUSED',
        'ENETUNREACH',
        'EHOSTUNREACH',
        'ECANCELED',
        'canceled',
        'cancelled',
        'ERR_NETWORK',
      ];

      networkMessages.forEach((msg) => {
        const error = new Error(msg);
        const result = api.testHandleApiError(error, 'Login');

        expect(result.code).toBe(ApiErrorCodes.NETWORK);
      });
    });

    it('should handle generic errors', () => {
      const error = new Error('Something went wrong');
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Login failed. Please try again.');
      expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
    });

    it('should handle non-Error objects', () => {
      const error = { unknown: 'error' };
      const result = api.testHandleApiError(error, 'Login');

      expect(result.message).toBe('Login failed. Please try again.');
      expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
    });

    it('should handle null/undefined errors', () => {
      const nullResult = api.testHandleApiError(null, 'Login');

      expect(nullResult.message).toBe('Login failed. Please try again.');
      expect(nullResult.code).toBe(ApiErrorCodes.UNKNOWN);

      const undefinedResult = api.testHandleApiError(undefined, 'Login');

      expect(undefinedResult.message).toBe('Login failed. Please try again.');
      expect(undefinedResult.code).toBe(ApiErrorCodes.UNKNOWN);
    });
  });
});
