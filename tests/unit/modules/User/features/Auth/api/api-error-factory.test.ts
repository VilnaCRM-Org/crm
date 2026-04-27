import ApiErrorFactory from '@/modules/User/features/Auth/api/api-error-factory';
import { ApiErrorCodes } from '@/modules/User/features/Auth/api/ApiErrors';

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
  });

  describe('fromGenericError', () => {
    it('preserves the original error as cause for unknown generic errors', () => {
      const originalError = new Error('Unexpected failure');

      const apiError = ApiErrorFactory.fromGenericError(originalError, 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.UNKNOWN);
      expect(apiError.message).toBe('Login failed. Please try again.');
      expect(apiError.cause).toBe(originalError);
    });
  });
});
