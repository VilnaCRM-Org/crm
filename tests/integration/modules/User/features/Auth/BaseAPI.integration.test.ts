import '../../../../setup';
import {
  ApiError,
  AuthenticationError,
  ConflictError,
  ValidationError,
  ApiErrorCodes,
} from '@/modules/User/features/Auth/api/ApiErrors';
import BaseAPI from '@/modules/User/features/Auth/api/BaseAPI';
import { HttpError } from '@/services/HttpsClient/HttpError';

// Test class that extends BaseAPI to expose the protected method
class TestAPI extends BaseAPI {
  public testHandleApiError(error: unknown, context: string): ApiError {
    return this.handleApiError(error, context);
  }
}

describe('BaseAPI Integration', () => {
  let api: TestAPI;

  beforeEach(() => {
    api = new TestAPI();
  });

  describe('handleApiError method', () => {
    describe('HttpError handling', () => {
      it('should return AuthenticationError for 401 status', () => {
        const httpError = new HttpError({ status: 401, message: 'Unauthorized' });
        const result = api.testHandleApiError(httpError, 'Login');

        expect(result).toBeInstanceOf(AuthenticationError);
        expect(result.message).toBe('Invalid credentials');
      });

      it('should return ValidationError for 400 status', () => {
        const httpError = new HttpError({ status: 400, message: 'Bad request' });
        const result = api.testHandleApiError(httpError, 'Login');

        expect(result).toBeInstanceOf(ValidationError);
        expect(result.message).toBe('Invalid login data');
        expect(result.status).toBe(400);
      });

      it('should return ValidationError for 422 status', () => {
        const httpError = new HttpError({ status: 422, message: 'Unprocessable entity' });
        const result = api.testHandleApiError(httpError, 'Registration');

        expect(result).toBeInstanceOf(ValidationError);
        expect(result.message).toBe('Unprocessable registration data');
        expect(result.status).toBe(422);
      });

      it('should return ConflictError for 409 status', () => {
        const httpError = new HttpError({ status: 409, message: 'Conflict' });
        const result = api.testHandleApiError(httpError, 'User');

        expect(result).toBeInstanceOf(ConflictError);
        expect(result.message).toBe('User conflict. Resource already exists.');
      });

      it('should return Forbidden ApiError for 403 status', () => {
        const httpError = new HttpError({ status: 403, message: 'Forbidden' });
        const result = api.testHandleApiError(httpError, 'Resource');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Forbidden');
        expect(result.code).toBe(ApiErrorCodes.FORBIDDEN);
        expect(result.status).toBe(403);
      });

      it('should return Not Found ApiError for 404 status', () => {
        const httpError = new HttpError({ status: 404, message: 'Not found' });
        const result = api.testHandleApiError(httpError, 'User');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('User not found');
        expect(result.code).toBe(ApiErrorCodes.NOT_FOUND);
      });

      it('should return Timeout ApiError for 408 status', () => {
        const httpError = new HttpError({ status: 408, message: 'Request timeout' });
        const result = api.testHandleApiError(httpError, 'Request');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Request timed out. Please try again.');
        expect(result.code).toBe(ApiErrorCodes.TIMEOUT);
      });

      it('should return Rate Limited ApiError for 429 status', () => {
        const httpError = new HttpError({ status: 429, message: 'Too many requests' });
        const result = api.testHandleApiError(httpError, 'API');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Too many requests. Please slow down.');
        expect(result.code).toBe(ApiErrorCodes.RATE_LIMITED);
      });

      it('should return Server Error ApiError for 500 status', () => {
        const httpError = new HttpError({ status: 500, message: 'Internal server error' });
        const result = api.testHandleApiError(httpError, 'Server');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Server error. Please try again later.');
        expect(result.code).toBe(ApiErrorCodes.SERVER);
      });

      it('should return Service Unavailable ApiError for 502 status', () => {
        const httpError = new HttpError({ status: 502, message: 'Bad gateway' });
        const result = api.testHandleApiError(httpError, 'Service');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Service unavailable. Please try again later.');
        expect(result.code).toBe(ApiErrorCodes.SERVER);
      });

      it('should return Service Unavailable ApiError for 503 status', () => {
        const httpError = new HttpError({ status: 503, message: 'Service unavailable' });
        const result = api.testHandleApiError(httpError, 'Service');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Service unavailable. Please try again later.');
        expect(result.code).toBe(ApiErrorCodes.SERVER);
      });

      it('should return Service Unavailable ApiError for 504 status', () => {
        const httpError = new HttpError({ status: 504, message: 'Gateway timeout' });
        const result = api.testHandleApiError(httpError, 'Service');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Service unavailable. Please try again later.');
        expect(result.code).toBe(ApiErrorCodes.SERVER);
      });

      it('should return Network Error for status 0', () => {
        const httpError = new HttpError({ status: 0, message: 'Network error' });
        const result = api.testHandleApiError(httpError, 'Request');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Network error. Please check your connection.');
        expect(result.code).toBe(ApiErrorCodes.NETWORK);
      });

      it('should return Network Error for HttpError with network error message', () => {
        const httpError = new HttpError({ status: 0, message: 'Failed to fetch' });
        const result = api.testHandleApiError(httpError, 'Request');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Network error. Please check your connection.');
        expect(result.code).toBe(ApiErrorCodes.NETWORK);
      });

      it('should return Unknown Error for unhandled status codes', () => {
        const httpError = new HttpError({ status: 418, message: "I'm a teapot" });
        const result = api.testHandleApiError(httpError, 'Request');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Request failed');
        expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
      });
    });

    describe('AbortError handling', () => {
      it('should return Cancelled Error for AbortError', () => {
        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';

        const result = api.testHandleApiError(abortError, 'Request');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Request canceled.');
        expect(result.code).toBe(ApiErrorCodes.CANCELLED);
      });

      it('should return Cancelled Error for error with abort in message', () => {
        const error = new Error('Request abort');

        const result = api.testHandleApiError(error, 'Request');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Request canceled.');
        expect(result.code).toBe(ApiErrorCodes.CANCELLED);
      });

      it('should handle AbortError with uppercase name', () => {
        const error = new Error('Aborted');
        Object.defineProperty(error, 'name', { value: 'ABORTERROR' });

        const result = api.testHandleApiError(error, 'Request');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Request canceled.');
      });
    });

    describe('Network error detection', () => {
      it('should detect "failed to fetch" as network error', () => {
        const error = new Error('Failed to fetch');
        const result = api.testHandleApiError(error, 'Request');

        expect(result.message).toBe('Network error. Please check your connection.');
        expect(result.code).toBe(ApiErrorCodes.NETWORK);
      });

      it('should detect "network" keyword as network error', () => {
        const error = new Error('Network request failed');
        const result = api.testHandleApiError(error, 'Request');

        expect(result.message).toBe('Network error. Please check your connection.');
      });

      it('should detect "connection" keyword as network error', () => {
        const error = new Error('Connection refused');
        const result = api.testHandleApiError(error, 'Request');

        expect(result.message).toBe('Network error. Please check your connection.');
      });

      it('should detect "timeout" keyword as network error', () => {
        const error = new Error('Connection timeout');
        const result = api.testHandleApiError(error, 'Request');

        expect(result.message).toBe('Network error. Please check your connection.');
      });

      it('should detect "cors" keyword as network error', () => {
        const error = new Error('CORS policy blocked');
        const result = api.testHandleApiError(error, 'Request');

        expect(result.message).toBe('Network error. Please check your connection.');
      });

      it('should detect "ECONNRESET" as network error', () => {
        const error = new Error('ECONNRESET');
        const result = api.testHandleApiError(error, 'Request');

        expect(result.message).toBe('Network error. Please check your connection.');
      });

      it('should detect "ENOTFOUND" as network error', () => {
        const error = new Error('ENOTFOUND');
        const result = api.testHandleApiError(error, 'Request');

        expect(result.message).toBe('Network error. Please check your connection.');
      });

      it('should detect "ECONNREFUSED" as network error', () => {
        const error = new Error('ECONNREFUSED');
        const result = api.testHandleApiError(error, 'Request');

        expect(result.message).toBe('Network error. Please check your connection.');
      });

      it('should detect "ENETUNREACH" as network error', () => {
        const error = new Error('ENETUNREACH');
        const result = api.testHandleApiError(error, 'Request');

        expect(result.message).toBe('Network error. Please check your connection.');
      });

      it('should detect "EHOSTUNREACH" as network error', () => {
        const error = new Error('EHOSTUNREACH');
        const result = api.testHandleApiError(error, 'Request');

        expect(result.message).toBe('Network error. Please check your connection.');
      });

      it('should detect "ECANCELED" as network error', () => {
        const error = new Error('ECANCELED');
        const result = api.testHandleApiError(error, 'Request');

        expect(result.message).toBe('Network error. Please check your connection.');
      });

      it('should detect "canceled" keyword as network error', () => {
        const error = new Error('Request was canceled');
        const result = api.testHandleApiError(error, 'Request');

        expect(result.message).toBe('Network error. Please check your connection.');
      });

      it('should detect "cancelled" keyword as network error', () => {
        const error = new Error('Request was cancelled');
        const result = api.testHandleApiError(error, 'Request');

        expect(result.message).toBe('Network error. Please check your connection.');
      });

      it('should detect "ERR_NETWORK" as network error', () => {
        const error = new Error('ERR_NETWORK');
        const result = api.testHandleApiError(error, 'Request');

        expect(result.message).toBe('Network error. Please check your connection.');
      });
    });

    describe('Unknown error handling', () => {
      it('should return Unknown Error for generic Error', () => {
        const error = new Error('Generic error');
        const result = api.testHandleApiError(error, 'Operation');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Operation failed. Please try again.');
        expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
      });

      it('should return Unknown Error for string', () => {
        const result = api.testHandleApiError('String error', 'Operation');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Operation failed. Please try again.');
        expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
      });

      it('should return Unknown Error for null', () => {
        const result = api.testHandleApiError(null, 'Operation');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Operation failed. Please try again.');
      });

      it('should return Unknown Error for undefined', () => {
        const result = api.testHandleApiError(undefined, 'Operation');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Operation failed. Please try again.');
      });

      it('should return Unknown Error for object', () => {
        const result = api.testHandleApiError({ unknown: 'error' }, 'Operation');

        expect(result).toBeInstanceOf(ApiError);
        expect(result.message).toBe('Operation failed. Please try again.');
      });
    });

    describe('Error with missing properties', () => {
      it('should handle Error without name property', () => {
        const error = new Error('Test');
        Object.defineProperty(error, 'name', { value: undefined });

        // Should not throw, should return Unknown Error
        const result = api.testHandleApiError(error, 'Test');
        expect(result).toBeInstanceOf(ApiError);
      });

      it('should handle Error without message property', () => {
        const error = new Error();
        Object.defineProperty(error, 'message', { value: undefined });

        // Should not throw, should detect network patterns or return unknown
        const result = api.testHandleApiError(error, 'Test');
        expect(result).toBeInstanceOf(ApiError);
      });
    });
  });
});
