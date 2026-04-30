import ApiErrorFactory from '@/modules/User/features/Auth/api/api-error-factory';
import { ApiErrorCodes } from '@/modules/User/features/Auth/api/ApiErrors';
import { HttpError } from '@/services/HttpsClient/HttpError';

describe('ApiErrorFactory', () => {
  describe('fromHttpError', () => {
    it.each([
      [408, 'Network timeout while waiting for response', ApiErrorCodes.TIMEOUT],
      [504, 'Network gateway timeout', ApiErrorCodes.SERVICE_UNAVAILABLE],
    ])(
      'prefers HTTP %i status mapping over network keyword matching',
      (status, message, expectedCode) => {
        const httpError = { status, message };

        const apiError = ApiErrorFactory.fromHttpError(httpError, 'Login');

        expect(apiError.code).toBe(expectedCode);
        expect(apiError.cause).toBe(httpError);
      }
    );

    it('maps cancellation-style HTTP failures to the cancelled code', () => {
      const httpError = { status: 499, message: 'Request aborted by client' };

      const apiError = ApiErrorFactory.fromHttpError(httpError, 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.CANCELLED);
      expect(apiError.message).toBe('Request canceled.');
      expect(apiError.cause).toBe(httpError);
    });
  });

  describe('fromGenericError', () => {
    it('preserves the original error as cause for unknown generic errors', () => {
      const originalError = new Error('Unexpected failure');

      const apiError = ApiErrorFactory.fromGenericError(originalError, 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.UNKNOWN);
      expect(apiError.message).toBe('Login failed. Please try again.');
      expect(apiError.cause).toBe(originalError);
    });

    it('maps AbortError instances to the cancelled code', () => {
      const abortError = Object.assign(new Error('The operation was aborted'), {
        name: 'AbortError',
      });

      const apiError = ApiErrorFactory.fromGenericError(abortError, 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.CANCELLED);
      expect(apiError.message).toBe('Request canceled.');
      expect(apiError.cause).toBe(abortError);
    });
  });

  describe('convert', () => {
    const factory = new ApiErrorFactory();

    it('converts HttpError instances via the HTTP factory path', () => {
      const converted = factory.convert(
        new HttpError({ status: 401, message: 'Unauthorized' }),
        'Login'
      );

      expect(converted.code).toBe(ApiErrorCodes.AUTH);
      expect(converted.message).toBe('Invalid credentials');
    });

    it('converts generic Error instances via the generic factory path', () => {
      const converted = factory.convert(new Error('Failed to fetch'), 'Login');

      expect(converted.code).toBe(ApiErrorCodes.NETWORK);
      expect(converted.message).toBe('Network error. Please check your connection.');
    });

    it('converts unknown values via the unknown factory path', () => {
      const converted = factory.convert('unexpected-value', 'Login');

      expect(converted.code).toBe(ApiErrorCodes.UNKNOWN);
      expect(converted.message).toBe('Login failed. Please try again.');
    });
  });
});
